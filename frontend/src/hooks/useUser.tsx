import { useState, useEffect } from "react";
import { useUserStore } from "@/store/store";
import { type IUser } from "@/store/store";
function useUser() {
  const userStore = useUserStore();
  const [user, setUser] = useState<IUser | null>(null);
  useEffect(() => {
    (async () => {
      const User = await userStore.getUser();
      setUser(User);
    })();
    return () => {};
  }, [userStore]);
  return user;
}

export default useUser;
