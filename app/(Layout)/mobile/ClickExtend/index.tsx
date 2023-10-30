// Components
import { Dispatch, ReactNode, SetStateAction } from "react";
import { Property, Properties } from "csstype";

// Styles
import styles from "./ClickExtend.module.scss";


export default function ClickExtend({
  heightBefore,
  heightAfter,
  customStyles = {},
  extendedState: [
    extended,
    setExtended
  ],
  children
}: {
  heightBefore: Property.Height,
  heightAfter: Property.Height,
  customStyles?: Properties,
  extendedState: [
    extended: boolean,
    setExtended: Dispatch<SetStateAction<boolean>>,
  ],
  children: ReactNode
}) {
  const handleCommentClick = () => {
    setExtended(!extended);
  };

  return (
    <div
      className={styles.wrapper}
      style={{
        height: extended ? heightAfter : heightBefore,
        ...customStyles
      }}
      onClick={handleCommentClick}
    >
      {children}
    </div>
  );
}
