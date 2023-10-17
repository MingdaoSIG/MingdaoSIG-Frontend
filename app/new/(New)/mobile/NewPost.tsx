import { Dispatch, SetStateAction } from "react";

// Components
import Editor from "./Editor";
import MetaDataForm from "./MetaDataForm";

// styles
import styles from "./NewPost.module.scss";

interface Props {
  editorContent: string;
  setEditorContent: Dispatch<SetStateAction<string>>;
  discard: Function;
  post: Function;
}

export default function NewPostMobile(props: Props) {
  return (
    <div className={styles.newPost}>
      <MetaDataForm></MetaDataForm>
      <Editor
        setFunction={props.setEditorContent}
        editorContent={props.editorContent}
      ></Editor>
    </div>
  );
}
