import { EditProposal, EditProposalInput } from '@/types';

export interface IEditService {
  proposeEdit(data: EditProposalInput): Promise<string>;
  getPendingEdits(): Promise<EditProposal[]>;
  approveEdit(editId: string): Promise<string>;
  rejectEdit(editId: string): Promise<void>;
}
