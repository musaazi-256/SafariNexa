import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@/components/ui/message";

/** shadcn message demo: sent (end) and received (start) bubbles, grouped bubbles, a reaction and a typing marker. */
export function ChatMessages() {
  const me = <MessageAvatar><Avatar className="h-8 w-8"><AvatarFallback className="text-xs">NC</AvatarFallback></Avatar></MessageAvatar>;
  const guest = <MessageAvatar><Avatar className="h-8 w-8"><AvatarFallback className="text-xs">SN</AvatarFallback></Avatar></MessageAvatar>;
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 py-6">
      <Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>
      <Message>{guest}<MessageContent><Bubble variant="muted"><BubbleContent>Hello! Could we check in around noon?</BubbleContent></Bubble></MessageContent></Message>
      <Message align="end">{me}<MessageContent><Bubble><BubbleContent>Yes, noon works. We&apos;ll have the banda ready.</BubbleContent></Bubble><MessageFooter>Read</MessageFooter></MessageContent></Message>
      <Message>
        {guest}
        <MessageContent>
          <BubbleGroup>
            <Bubble variant="muted"><BubbleContent>Wonderful, thank you!</BubbleContent></Bubble>
            <Bubble variant="muted"><BubbleContent>Is the airport pickup still available?</BubbleContent><BubbleReactions aria-label="Reactions: thumbs up"><span>👍</span></BubbleReactions></Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
      <Marker role="status"><MarkerContent className="animate-pulse motion-reduce:animate-none"><span className="font-medium">Sarah</span> is typing…</MarkerContent></Marker>
    </div>
  );
}
