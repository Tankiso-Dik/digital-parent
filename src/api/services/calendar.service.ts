import { httpClient } from "@/api/client";
import { optionalString, pb, pbCollections } from "@/lib/pb";
import { parseLocalDate } from "@/lib/time-utils";
import type {
  ApiResponse,
  CalendarEvent,
  CalendarEventResponse,
  CreateEventRequest,
  GetEventsParams,
  UpdateEventRequest,
} from "@/lib/types";
import { familyService } from "./family.service";

/**
 * Convert a wire-format event response (date as string) to a domain CalendarEvent (date as Date).
 * Centralizes date parsing so components always work with proper Date objects.
 */
function toCalendarEvent(raw: CalendarEventResponse): CalendarEvent {
  return {
    ...raw,
    date: parseLocalDate(raw.date),
    endDate: raw.endDate ? parseLocalDate(raw.endDate) : undefined,
  };
}

function mapEventResponse(
  response: ApiResponse<CalendarEventResponse>,
): ApiResponse<CalendarEvent> {
  return { ...response, data: toCalendarEvent(response.data) };
}

function mapEventsResponse(
  response: ApiResponse<CalendarEventResponse[]>,
): ApiResponse<CalendarEvent[]> {
  return { ...response, data: response.data.map(toCalendarEvent) };
}

function mapRecordToEvent(
  record: Record<string, unknown>,
): CalendarEventResponse {
  return {
    id: String(record.id),
    title: String(record.title ?? ""),
    date: String(record.date ?? ""),
    startTime: String(record.startTime ?? ""),
    endTime: String(record.endTime ?? ""),
    endDate: optionalString(record.endDate),
    memberId: String(record.memberId ?? ""),
    isAllDay: Boolean(record.isAllDay),
    location: optionalString(record.location),
    recurrenceRule: optionalString(record.recurrenceRule),
    recurringEventId: optionalString(record.recurringEventId),
    source: (record.source as CalendarEventResponse["source"]) ?? "NATIVE",
    description: optionalString(record.description),
    htmlLink: optionalString(record.htmlLink),
  };
}

async function requireFamilyId(): Promise<string> {
  const response = await familyService.getFamily();
  if (!response.data) {
    throw new Error("Family not found");
  }
  return response.data.id;
}

export const calendarService = {
  async getEvents(
    params: GetEventsParams,
  ): Promise<ApiResponse<CalendarEvent[]>> {
    if (import.meta.env.MODE === "test") {
      return mapEventsResponse(
        await httpClient.get<ApiResponse<CalendarEventResponse[]>>(
          "/calendar/events",
          {
            params: params as unknown as Record<string, string | undefined>,
          },
        ),
      );
    }

    const familyId = await requireFamilyId();
    const filterParts = [
      pb.filter("familyId = {:familyId}", { familyId }),
      pb.filter("date >= {:startDate}", { startDate: params.startDate }),
      pb.filter("date <= {:endDate}", { endDate: params.endDate }),
    ];
    if (params.memberId) {
      filterParts.push(pb.filter("memberId = {:memberId}", params));
    }

    const records = await pb.collection(pbCollections.events).getFullList({
      filter: filterParts.join(" && "),
      sort: "date,startTime",
    });
    return mapEventsResponse({ data: records.map(mapRecordToEvent) });
  },

  async getEventById(id: string): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE === "test") {
      return mapEventResponse(
        await httpClient.get<ApiResponse<CalendarEventResponse>>(
          `/calendar/events/${id}`,
        ),
      );
    }

    const record = await pb.collection(pbCollections.events).getOne(id);
    return mapEventResponse({ data: mapRecordToEvent(record) });
  },

  async createEvent(
    request: CreateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE === "test") {
      return mapEventResponse(
        await httpClient.post<ApiResponse<CalendarEventResponse>>(
          "/calendar/events",
          request,
        ),
      );
    }

    const familyId = await requireFamilyId();
    const record = await pb.collection(pbCollections.events).create({
      ...request,
      familyId,
      isAllDay: request.isAllDay ?? false,
      source: "NATIVE",
    });
    return mapEventResponse({ data: mapRecordToEvent(record) });
  },

  async updateEvent(
    id: string,
    request: UpdateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE === "test") {
      return mapEventResponse(
        await httpClient.put<ApiResponse<CalendarEventResponse>>(
          `/calendar/events/${id}`,
          request,
        ),
      );
    }

    const record = await pb.collection(pbCollections.events).update(id, {
      ...request,
      isAllDay: request.isAllDay ?? false,
    });
    return mapEventResponse({ data: mapRecordToEvent(record) });
  },

  async deleteEvent(id: string): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete(`/calendar/events/${id}`);
    }

    await pb.collection(pbCollections.events).delete(id);
  },

  async updateInstance(
    parentId: string,
    date: string,
    request: UpdateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE === "test") {
      return mapEventResponse(
        await httpClient.put<ApiResponse<CalendarEventResponse>>(
          `/calendar/events/${parentId}/instances/${date}`,
          request,
        ),
      );
    }

    const familyId = await requireFamilyId();
    const record = await pb.collection(pbCollections.events).create({
      ...request,
      familyId,
      recurringEventId: parentId,
      originalDate: date,
      isAllDay: request.isAllDay ?? false,
      source: "NATIVE",
    });
    return mapEventResponse({ data: mapRecordToEvent(record) });
  },

  async deleteInstance(parentId: string, date: string): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete(
        `/calendar/events/${parentId}/instances/${date}`,
      );
    }

    const familyId = await requireFamilyId();
    const record = await pb
      .collection(pbCollections.events)
      .getFirstListItem(
        [
          pb.filter("familyId = {:familyId}", { familyId }),
          pb.filter("recurringEventId = {:parentId}", { parentId }),
          pb.filter("date = {:date}", { date }),
        ].join(" && "),
      );
    await pb.collection(pbCollections.events).delete(record.id);
  },
};
