/** A colleague opening a thread must not clear another staff member's unread state. */
export function projectMessageReadState<T extends { senderId: string; readAt?: Date | null; readReceipts: Array<{userId:string;readAt:Date}> }>(messages:T[],viewerId:string,customerId:string){
  return messages.map(message => ({
    ...message,
    readAt: message.senderId !== viewerId
      ? message.readReceipts.find(r=>r.userId===viewerId)?.readAt ?? null
      : message.readReceipts.find(r=>viewerId===customerId?r.userId!==customerId:r.userId===customerId)?.readAt ?? null
  }));
}
