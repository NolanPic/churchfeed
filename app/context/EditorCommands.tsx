"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EditorCommands = {
  focus: () => void;
  addImageDrop: () => void;
};

const noop = () => {};

const defaultCommands: EditorCommands = {
  focus: noop,
  addImageDrop: noop,
};

const CommandsContext = createContext<EditorCommands>(defaultCommands);
const CommandsRegisterContext = createContext<
  (cmds: EditorCommands | null) => void
>(() => {});

export function EditorCommandsProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<EditorCommands>(defaultCommands);

  const register = useMemo(() => {
    return (cmds: EditorCommands | null) => {
      setCommands(cmds ?? defaultCommands);
    };
  }, []);

  return (
    <CommandsRegisterContext.Provider value={register}>
      <CommandsContext.Provider value={commands}>
        {children}
      </CommandsContext.Provider>
    </CommandsRegisterContext.Provider>
  );
}

export function useEditorCommands(): EditorCommands {
  return useContext(CommandsContext);
}

export function useRegisterEditorCommands(): (
  cmds: EditorCommands | null
) => void {
  return useContext(CommandsRegisterContext);
}
