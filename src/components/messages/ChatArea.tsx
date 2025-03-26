
import React from "react";
import { useMessages } from "./MessagesContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import EmptyState from "./EmptyState";

const ChatArea = () => {
  const { selectedContact } = useMessages();

  if (!selectedContact) {
    return <EmptyState />;
  }

  return (
    <>
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </>
  );
};

export default ChatArea;
