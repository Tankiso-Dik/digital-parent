import { httpClient } from "@/api/client";
import { convex } from "@/lib/convex";
import { parseLocalDate } from "@/lib/time-utils";
import type {
  ApiResponse,
  CalendarEvent,
  CalendarEventResponse,
  CreateEventRequest,
  GetEventsParams,
  UpdateEventRequest,
} from "@/lib/types";
import { api } from "../../../convex/_generated/api";

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

function asEventResponse(
  response: unknown,
): ApiResponse<CalendarEventResponse> {
  return response as ApiResponse<CalendarEventResponse>;
}

function asEventsResponse(
  response: unknown,
): ApiResponse<CalendarEventResponse[]> {
  return response as ApiResponse<CalendarEventResponse[]>;
}

export const calendarService = {
  async getEvents(
    params: GetEventsParams,
  ): Promise<ApiResponse<CalendarEvent[]>> {
    if (import.meta.env.MODE !== "test") {
      return mapEventsResponse(
        asEventsResponse(
          await convex.query(api.events.getEvents, {
            startDate: params.startDate,
            endDate: params.endDate,
            memberId: params.memberId as never,
          }),
        ),
      );
    }

    return mapEventsResponse(
      await httpClient.get<ApiResponse<CalendarEventResponse[]>>(
        "/calendar/events",
        {
          params: params as unknown as Record<string, string | undefined>,
        },
      ),
    );
  },

  async getEventById(id: string): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE !== "test") {
      return mapEventResponse(
        asEventResponse(
          await convex.query(api.events.getEventById, { id: id as never }),
        ),
      );
    }

    return mapEventResponse(
      await httpClient.get<ApiResponse<CalendarEventResponse>>(
        `/calendar/events/${id}`,
      ),
    );
  },

  async createEvent(
    request: CreateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE !== "test") {
      return mapEventResponse(
        asEventResponse(
          await convex.mutation(api.events.createEvent, {
            title: request.title,
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            endDate: request.endDate ?? null,
            memberId: request.memberId as never,
            isAllDay: request.isAllDay ?? false,
            location: request.location ?? null,
            recurrenceRule: request.recurrenceRule ?? null,
            description: request.description ?? null,
          }),
        ),
      );
    }

    return mapEventResponse(
      await httpClient.post<ApiResponse<CalendarEventResponse>>(
        "/calendar/events",
        request,
      ),
    );
  },

  async updateEvent(
    id: string,
    request: UpdateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE !== "test") {
      return mapEventResponse(
        asEventResponse(
          await convex.mutation(api.events.updateEvent, {
            id: id as never,
            title: request.title,
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            endDate: request.endDate ?? null,
            memberId: request.memberId as never,
            isAllDay: request.isAllDay ?? false,
            location: request.location ?? null,
            recurrenceRule: request.recurrenceRule ?? null,
            description: request.description ?? null,
          }),
        ),
      );
    }

    return mapEventResponse(
      await httpClient.put<ApiResponse<CalendarEventResponse>>(
        `/calendar/events/${id}`,
        request,
      ),
    );
  },

  async deleteEvent(id: string): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      await convex.mutation(api.events.deleteEvent, { id: id as never });
      return;
    }

    return httpClient.delete(`/calendar/events/${id}`);
  },

  async updateInstance(
    parentId: string,
    date: string,
    request: UpdateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (import.meta.env.MODE !== "test") {
      return mapEventResponse(
        asEventResponse(
          await convex.mutation(api.events.updateInstance, {
            parentId: parentId as never,
            instanceDate: date,
            title: request.title,
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            memberId: request.memberId as never,
            isAllDay: request.isAllDay ?? false,
            location: request.location ?? null,
            description: request.description ?? null,
          }),
        ),
      );
    }

    return mapEventResponse(
      await httpClient.put<ApiResponse<CalendarEventResponse>>(
        `/calendar/events/${parentId}/instances/${date}`,
        request,
      ),
    );
  },

  async deleteInstance(parentId: string, date: string): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      await convex.mutation(api.events.deleteInstance, {
        parentId: parentId as never,
        date,
      });
      return;
    }

    return httpClient.delete(`/calendar/events/${parentId}/instances/${date}`);
  },
};
