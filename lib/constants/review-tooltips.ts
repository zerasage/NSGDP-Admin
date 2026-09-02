export const REVIEW_PAGE_TIP =
  "Score the dataset against eight QA dimensions, adjust visibility if needed, then send to a director for final approval or return it for revision.";

export const REVIEW_SUBMISSION_SUMMARY_TIP =
  "Key metadata from the upload. Visibility can be changed here before approval — private datasets are never listed on the public catalogue.";

export const REVIEW_DECISION_TIP =
  "Complete every checklist item with no failures before sending forward. Request revision returns the dataset to the submitter; archive removes it from the active queue.";

export const REVIEW_SEND_APPROVAL_TIP =
  "Locks in your QA scores and moves the dataset to the director approval screen. The catalogue publish step still happens separately after approval.";

export const REVIEW_REVISION_TIP =
  "Sends the dataset back to the submitter with your feedback. They must fix issues and resubmit before review can continue.";

export const VISIBILITY_OPTION_TIPS = {
  public: "Listed on the public catalogue when published — anyone can discover and download.",
  restricted:
    "Visible on the catalogue but downloads require an approved access request.",
  private:
    "Hidden from the public catalogue — only the owning organisation can access. Setting private unpublishes a live dataset.",
} as const;

export const APPROVE_PAGE_TIP =
  "Director sign-off after QA review. Approving records the decision — publish separately from the dataset page when ready for the public catalogue.";

export const APPROVE_PIPELINE_TIP =
  "Shows where this dataset sits in the workflow. Director approval is distinct from catalogue publish.";

export const APPROVE_DECISION_TIP =
  "Approve when QA is complete. Reject returns the dataset to the submitter with a reason — minimum 20 characters.";

export const APPROVE_REJECT_TIP =
  "Sends the dataset back for revision. The submitter must fix issues and resubmit before review continues.";
