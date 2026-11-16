import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import TextInput, { type TextInputProps } from "./TextInput";

type PasswordInputProps = Omit<TextInputProps, "type" | "trailing"> & {
  type?: "password";
};

const PasswordInput = ({ type = "password", ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      type={visible ? "text" : type}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-muted hover:text-ink"
        >
          {visible ? (
            <MdVisibilityOff size={20} aria-hidden="true" />
          ) : (
            <MdVisibility size={20} aria-hidden="true" />
          )}
        </button>
      }
    />
  );
};

export default PasswordInput;
