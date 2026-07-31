import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaClipboard, FaClipboardCheck } from "react-icons/fa";
import { authFetch } from "../lib/api";
import { extractOtp } from "../lib/otp";
import { formatStamp } from "../lib/time";
import { useSocket } from "./SocketProvider";
import Avatar, { HandleAvatar } from "../UI/Avatar";
import Linkify from "../UI/Linkify";
import { setImageURL, setSelectedChat } from "../store/Store";
import Loader from "./Loader";

const LIMIT = 100;

// A flat feed of the latest LIMIT messages across all senders, kept live via the socket
// (new messages prepend; the list stays capped at LIMIT).
export default function AllMessages() {
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authFetch(`/messages?limit=${LIMIT}`);
        const data = await res.json();
        if (active && data.status === "success" && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load all messages:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (m) => setMessages((prev) => [m, ...prev].slice(0, LIMIT));
    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket]);

  const openChat = (m) => {
    dispatch(setSelectedChat({ id: m.id, sender: m.sender, sim: m.sim, mute: true }));
    dispatch(setImageURL(HandleAvatar(m.sender)));
    navigate("/");
  };

  const copyOtp = (code, key) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      <div className="p-3 text-lg font-bold bg-gray-800">
        All messages · latest {LIMIT}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-4 text-center font-bold">No messages</div>
        ) : (
          messages.map((m, i) => {
            const key = m.id ?? `${m.sender}-${m.sentStamp}-${i}`;
            const otp = extractOtp(m.text);
            return (
              <div
                key={key}
                className="animate-fade-in flex items-start gap-3 border-b border-gray-800 p-3 hover:bg-gray-800"
              >
                <div className="cursor-pointer" onClick={() => openChat(m)}>
                  <Avatar imageURL={HandleAvatar(m.sender)} sender={m.sender} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong
                      className="truncate cursor-pointer"
                      onClick={() => openChat(m)}
                    >
                      {m.sender}
                    </strong>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatStamp(m.sentStamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 break-words">
                    <Linkify text={m.text} />
                  </p>
                  {otp && (
                    <button
                      onClick={() => copyOtp(otp, key)}
                      className="mt-2 inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-sm hover:bg-gray-600"
                    >
                      {copiedKey === key ? (
                        <>
                          <FaClipboardCheck /> OTP copied
                        </>
                      ) : (
                        <>
                          <FaClipboard /> Copy OTP
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
