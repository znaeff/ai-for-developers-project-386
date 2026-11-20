import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Calendar Booking API" })
@server("/api", "Same-origin API")
namespace CalendarBooking;

model ErrorResponse {
  error: string;
}

@error
model BadRequest {
  @statusCode statusCode: 400;
  @body body: ErrorResponse;
}

@error
model NotFound {
  @statusCode statusCode: 404;
  @body body: ErrorResponse;
}

@error
model Conflict {
  @statusCode statusCode: 409;
  @body body: ErrorResponse;
}

model MeetingType {
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

model MeetingTypeInput {
  title: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  startsAt: utcDateTime;
  endsAt: utcDateTime;
}

model Booking {
  id: string;
  meetingTypeId: string;
  startsAt: utcDateTime;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

model BookingInput {
  meetingTypeId: string;
  startsAt: utcDateTime;
  guestName: string;
  guestEmail: string;
}

@route("/meeting-types")
interface MeetingTypes {
  @operationId("listMeetingTypes")
  @get
  list(): MeetingType[];

  @operationId("createMeetingType")
  @post
  create(@body input: MeetingTypeInput):
    | {
        @statusCode statusCode: 201;
        @body body: MeetingType;
      }
    | BadRequest;
}

@route("/meeting-types/{id}/slots")
interface Slots {
  @operationId("listSlots")
  @get
  list(@path id: string): Slot[] | NotFound;
}

@route("/bookings")
interface Bookings {
  @operationId("listBookings")
  @get
  list(): Booking[];

  @operationId("createBooking")
  @post
  create(@body input: BookingInput):
    | {
        @statusCode statusCode: 201;
        @body body: Booking;
      }
    | BadRequest
    | NotFound
    | Conflict;
}
