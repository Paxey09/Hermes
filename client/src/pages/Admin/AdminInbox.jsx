import { useEffect, useMemo, useState } from "react";

import {
  InboxHeader,
  InboxKPICards,
  InboxTabs,
  InboxSearchBar,
  ConversationItem,
  ConversationThread,
  InboxLoadingState,
  InboxErrorState,
} from "../../components/admin/layout/Admin_Inbox_Components.jsx";

import {
  getInboxData,
  sendMessage,
  markAsRead,
} from "../../services/inbox";

export default function AdminInbox() {
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInbox();
  }, []);

  async function loadInbox() {
    try {
      setLoading(true);
      setError("");

      const data = await getInboxData();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Inbox load error:", err);
      setError(err.message || "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);

    if (conversation.unread) {
      await markAsRead(conversation.id);

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversation.id ? { ...item, unread: false } : item
        )
      );
    }
  }

  async function handleReply(conversationId, text) {
    if (!text.trim()) return;

    const message = {
      id: Date.now(),
      from: "Me",
      fromInitials: "ME",
      internal: false,
      date: new Date().toISOString(),
      time: "Now",
      body: text,
    };

    await sendMessage(conversationId, message);

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, message] }
          : conversation
      )
    );

    setSelectedConversation((prev) =>
      prev?.id === conversationId
        ? { ...prev, messages: [...prev.messages, message] }
        : prev
    );
  }

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conversation) => {
        if (activeTab === "unread") return conversation.unread;
        if (activeTab === "archived") return conversation.category === "Archived";
        if (activeTab === "internal") return conversation.category === "Internal";
        if (activeTab === "starred") return conversation.starred;
        return conversation.category === "Inbox" || conversation.category === "Internal";
      })
      .filter((conversation) => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return true;

        return (
          conversation.subject.toLowerCase().includes(keyword) ||
          conversation.from.toLowerCase().includes(keyword) ||
          conversation.preview.toLowerCase().includes(keyword) ||
          conversation.linkedTo?.name?.toLowerCase().includes(keyword)
        );
      });
  }, [conversations, activeTab, search]);

  const unreadCount = conversations.filter((item) => item.unread).length;
  const archivedCount = conversations.filter((item) => item.category === "Archived").length;
  const newMessages = conversations.filter(
    (item) => item.unread && item.category === "Inbox"
  ).length;

  return (
    <div className="space-y-6">
      <InboxHeader onRefresh={loadInbox} />

      {loading && <InboxLoadingState />}

      {!loading && error && <InboxErrorState message={error} onRetry={loadInbox} />}

      {!loading && !error && (
        <>
          <InboxKPICards
            unreadCount={unreadCount}
            archivedCount={archivedCount}
            newMessages={newMessages}
            totalConversations={conversations.length}
          />

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <InboxTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setSelectedConversation(null);
                }}
                unreadCount={unreadCount}
              />

              <InboxSearchBar search={search} onSearchChange={setSearch} />
            </div>

            {selectedConversation ? (
              <div className="grid min-h-[540px] lg:grid-cols-[320px_1fr]">
                <div className="border-r border-gray-200">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      selected={selectedConversation}
                      onClick={() => handleSelectConversation(conversation)}
                    />
                  ))}
                </div>

                <ConversationThread
                  conversation={selectedConversation}
                  onReply={handleReply}
                  onBack={() => setSelectedConversation(null)}
                />
              </div>
            ) : (
              <div>
                {filteredConversations.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="text-4xl">📭</div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">No messages found</h3>
                    <p className="mt-1 text-sm text-gray-500">Your inbox is clean.</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      selected={selectedConversation}
                      onClick={() => handleSelectConversation(conversation)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
