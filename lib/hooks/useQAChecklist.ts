import { useMutation } from '@tanstack/react-query';
import { saveQAChecklist, type QAChecklistItemPayload } from '../api/qa-checklist';

export function useSaveQAChecklist() {
  return useMutation({
    mutationFn: ({ slug, items }: { slug: string; items: QAChecklistItemPayload[] }) =>
      saveQAChecklist(slug, items),
  });
}
