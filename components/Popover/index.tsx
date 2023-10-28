import React from "react";
import Popover from "@idui/react-popover";

type Props = {
  children: React.ReactNode;
  popoverContent: string;
};

export default function CustomPopover({ children, popoverContent }: Props) {
  return (
    <Popover content={popoverContent}>
      <>{children}</>
    </Popover>
  );
}
