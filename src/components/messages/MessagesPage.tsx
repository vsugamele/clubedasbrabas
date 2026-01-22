import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { MessagesProvider } from "./MessagesContext";
import ContactList from "./ContactList";
import ChatArea from "./ChatArea";
import { ContactType } from "./MessagesContext";

const MessagesPage = () => {
  const location = useLocation();
  const selectedContactFromNav = location.state?.selectedContact as ContactType | undefined;

  return (
    <MainLayout>
      <div className="container py-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Mensagens</h1>
        
        <MessagesProvider initialSelectedContact={selectedContactFromNav}>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-200px)]">
            {/* Contacts sidebar */}
            <div className="col-span-1 border-r border-gray-200">
              <ContactList />
            </div>
            
            {/* Chat area */}
            <div className="col-span-2 flex flex-col h-full">
              <ChatArea />
            </div>
          </div>
        </MessagesProvider>
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
