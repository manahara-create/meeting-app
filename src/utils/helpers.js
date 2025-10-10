// src/utils/helpers.js
import { dayjs } from 'dayjs';

export const formatDateTime = (dateTime) => {
  return new Date(dateTime).toLocaleString();
};

export const checkTimeConflict = (existingMeetings, newMeeting) => {
  // Helper function to check for time conflicts
  const newStart = new Date(newMeeting.scheduled_time);
  const newEnd = new Date(newStart.getTime() + newMeeting.duration_minutes * 60000);

  return existingMeetings.some(meeting => {
    if (meeting.id === newMeeting.id) return false;
    
    const meetingStart = new Date(meeting.scheduled_time);
    const meetingEnd = new Date(meetingStart.getTime() + meeting.duration_minutes * 60000);

    return (newStart < meetingEnd && newEnd > meetingStart);
  });
};