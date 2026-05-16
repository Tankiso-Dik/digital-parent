import { httpClient } from "@/api/client";
import { demoApi, isDemoModeActive } from "@/lib/demo-data";
import { parseLocalDate } from "@/lib/time-utils";
import type {
  ApiResponse,
  CalendarEvent,
  CalendarEventResponse,
  CreateEventRequest,
  GetEventsParams,
  UpdateEventRequest,
} from "@/lib/types";

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

export const calendarService = {
  async getEvents(
    params: GetEventsParams,
  ): Promise<ApiResponse<CalendarEvent[]>> {
    if (isDemoModeActive()) {
      return mapEventsResponse(demoApi.getEvents());
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
    if (isDemoModeActive()) {
      return mapEventResponse(demoApi.getEventById(id));
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
    if (isDemoModeActive()) {
      return mapEventResponse(demoApi.createEvent(request));
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
    if (isDemoModeActive()) {
      return mapEventResponse(demoApi.updateEvent(id, request));
    }

    return mapEventResponse(
      await httpClient.put<ApiResponse<CalendarEventResponse>>(
        `/calendar/events/${id}`,
        request,
      ),
    );
  },

  async deleteEvent(id: string): Promise<void> {
    if (isDemoModeActive()) {
      demoApi.deleteEvent(id);
      return;
    }

    return httpClient.delete(`/calendar/events/${id}`);
  },

  async updateInstance(
    parentId: string,
    date: string,
    request: UpdateEventRequest,
  ): Promise<ApiResponse<CalendarEvent>> {
    if (isDemoModeActive()) {
      return mapEventResponse(demoApi.updateEvent(parentId, request));
    }

    return mapEventResponse(
      await httpClient.put<ApiResponse<CalendarEventResponse>>(
        `/calendar/events/${parentId}/instances/${date}`,
        request,
      ),
    );
  },

  async deleteInstance(parentId: string, date: string): Promise<void> {
    if (isDemoModeActive()) {
      demoApi.deleteEvent(parentId);
      return;
    }

    return httpClient.delete(`/calendar/events/${parentId}/instances/${date}`);
  },
};
