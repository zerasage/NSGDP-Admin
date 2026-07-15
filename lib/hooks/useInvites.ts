import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganisationInvites,
  createInvite,
  revokeInvite,
  resendInvite,
  type CreateInviteRequest,
} from "@/lib/api/invites";

/**
 * Get all invites for an organisation
 */
export function useOrganisationInvites(organisationId: string) {
  return useQuery({
    queryKey: ["invites", organisationId],
    queryFn: () => getOrganisationInvites(organisationId),
    enabled: !!organisationId,
  });
}

/**
 * Create a new invite
 */
export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organisationId,
      data,
    }: {
      organisationId: string;
      data: CreateInviteRequest;
    }) => createInvite(organisationId, data),
    onSuccess: (_, variables) => {
      // Invalidate invites list for this org
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.organisationId],
      });
    },
  });
}

/**
 * Revoke an invite
 */
export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organisationId,
      inviteId,
    }: {
      organisationId: string;
      inviteId: string;
    }) => revokeInvite(organisationId, inviteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.organisationId],
      });
    },
  });
}

/**
 * Resend an invite
 */
export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organisationId,
      inviteId,
    }: {
      organisationId: string;
      inviteId: string;
    }) => resendInvite(organisationId, inviteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.organisationId],
      });
    },
  });
}
