"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteClientAction } from "@/app/dashboard/actions";

export function DeleteClientButton({ id }: { id: string }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isConfirming) {
      e.preventDefault();
      setIsConfirming(true);
      return;
    }
  };

  return (
    <form action={deleteClientAction}>
      <input type="hidden" name="id" value={id} />
      <Button variant="destructive" type="submit" onClick={handleClick}>
        <Trash2 className="h-4 w-4 mr-1" />
        {isConfirming ? "Confirm Delete" : "Delete"}
      </Button>
    </form>
  );
}
