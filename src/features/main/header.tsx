import { ModeToggle } from "@/components/common/ModeToggle";
import { config } from "@/config";

export const Header = () => {
  return (
    <header className="py-4">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">{config.appName}</h1>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
