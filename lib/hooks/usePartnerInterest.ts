import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPartnerInterests,
  getPartnerInterestById,
  reviewPartnerInterest,
  type GetPartnerInterestsParams,
  type ReviewPartnerInterestPayload,
} from '../api/partner-interest';

export function usePartnerInterests(params?: GetPartnerInterestsParams) {
  return useQuery({
    queryKey: ['partner-interests', params],
    queryFn: () => getPartnerInterests(params),
    placeholderData: keepPreviousData,
  });
}

export function usePartnerInterestById(id: string) {
  return useQuery({
    queryKey: ['partner-interest', id],
    queryFn: () => getPartnerInterestById(id),
    enabled: !!id,
  });
}

export function useReviewPartnerInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewPartnerInterestPayload }) =>
      reviewPartnerInterest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-interests'] });
      queryClient.invalidateQueries({ queryKey: ['partner-interest'] });
    },
  });
}
