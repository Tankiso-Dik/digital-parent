import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { pb } from "@/lib/pb";

interface PbAuthSnapshot {
  isReady: boolean;
  isAuthenticated: boolean;
  token: string;
  userId: string | null;
}

const PbAuthContext = createContext<PbAuthSnapshot | null>(null);

function readAuthSnapshot(): PbAuthSnapshot {
  return {
    isReady: true,
    isAuthenticated: pb.authStore.isValid,
    token: pb.authStore.token,
    userId: pb.authStore.record?.id ?? null,
  };
}

export function PbProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<PbAuthSnapshot>(() => readAuthSnapshot());

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setAuth(readAuthSnapshot());
    }, true);

    return unsubscribe;
  }, []);

  const value = useMemo(() => auth, [auth]);

  return (
    <PbAuthContext.Provider value={value}>{children}</PbAuthContext.Provider>
  );
}

export function usePbAuth(): PbAuthSnapshot {
  const auth = useContext(PbAuthContext);
  if (!auth) {
    throw new Error("usePbAuth must be used within PbProvider");
  }
  return auth;
}
