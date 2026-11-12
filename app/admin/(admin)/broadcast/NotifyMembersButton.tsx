"use client";

import { Megaphone } from "lucide-react";
import { useState } from "react";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui";
import type { AdminSig } from "../types";
import { BroadcastComposer } from "./BroadcastComposer";

// 「通知成員」 on the admin SIG detail (contract v4 §5.5): a broadcast to
// this SIG's members, leaders and 指導老師, for its managers and admins.

export function NotifyMembersButton({
  sig,
  memberCount,
}: {
  sig: AdminSig;
  memberCount?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Megaphone aria-hidden className="size-3.5" />
        通知成員
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`通知 ${sig.name} 的成員`}
        description="成員、幹部與指導老師會在通知中心收到這則通知。"
        wide
      >
        <div className="pb-5">
          <BroadcastComposer
            sigs={[]}
            allowAll={false}
            stacked
            fixedSig={{
              _id: sig._id,
              name: sig.name,
              memberCount: memberCount ?? sig.memberCount,
              managers: sig.leaders.length + sig.moderators.length,
            }}
            onSent={() => setOpen(false)}
          />
        </div>
      </Modal>
    </>
  );
}
