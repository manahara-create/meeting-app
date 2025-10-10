// src/hooks/useMeetings.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          organizer:profiles!organizer_id(full_name, email),
          participant:profiles!participant_id(full_name, email)
        `)
        .or(`organizer_id.eq.${user.id},participant_id.eq.${user.id}`)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return { meetings, loading, error, refetch: fetchMeetings };
};