import { Spinner } from "@material-tailwind/react";

export default function Loader() {
  return (
    <>
      <div className="flex justify-center h-screen">
        <Spinner className="h-12 w-12 text-center" />
      </div>
    </>
  );
}
