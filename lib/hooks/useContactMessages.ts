import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContactMessages,
  getContactMessageStats,
  updateContactMessage,
  type GetContactMessagesParams,
  type UpdateContactMessagePayload,
} from '../api/contact';

export function useContactMessages(params?: GetContactMessagesParams) {
  return useQuery({
    queryKey: ['contact-messages', params],
    queryFn: () => getContactMessages(params),
    placeholderData: keepPreviousData,
  });
}

export function useContactMessageStats() {
  return useQuery({
    queryKey: ['contact-messages-stats'],
    queryFn: getContactMessageStats,
  });
}

export function useUpdateContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactMessagePayload }) =>
      updateContactMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages-stats'] });
    },
  });
}
