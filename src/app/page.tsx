import { StoreHydrator } from "@/components/providers/store-hydrator";
import { EntryRouter } from "@/components/providers/entry-router";

export default function RootPage() {
  return (
    <StoreHydrator>
      <EntryRouter />
    </StoreHydrator>
  );
}
