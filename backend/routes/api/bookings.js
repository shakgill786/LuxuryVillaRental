const CREATE_BOOKING = 'bookings/CREATE_BOOKING';
const LOAD_BOOKINGS = 'bookings/LOAD_BOOKINGS';
const UPDATE_BOOKING = 'bookings/UPDATE_BOOKING';

export const createBooking = (booking) => async (dispatch) => {
  const response = await csrfFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  });
  const newBooking = await response.json();
  dispatch({ type: CREATE_BOOKING, payload: newBooking });
  return newBooking; // Return the newly created booking, if needed
};

export const fetchBookings = () => async (dispatch) => {
  const response = await csrfFetch('/api/bookings');
  const bookings = await response.json();
  dispatch({ type: LOAD_BOOKINGS, payload: bookings });
};

export const updateBooking = (bookingId, updatedData) => async (dispatch) => {
  const response = await csrfFetch(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedData),
  });
  const updatedBooking = await response.json();
  dispatch({ type: UPDATE_BOOKING, payload: updatedBooking });
  return updatedBooking; // Return the updated booking, if needed
};

export default function reducer(state = [], action) {
  switch (action.type) {
    case LOAD_BOOKINGS:
      return action.payload;
    case CREATE_BOOKING:
      return [...state, action.payload]; // Add the new booking to the state
    case UPDATE_BOOKING:
      return state.map((booking) =>
        booking.id === action.payload.id ? action.payload : booking
      ); // Update the matching booking
    default:
      return state;
  }
}
