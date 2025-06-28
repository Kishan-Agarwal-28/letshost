import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useApiPost } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { getErrorMsg } from "@/lib/getErrorMsg";
export default function Contact() {
  const formRefs = useRef<{
    firstName: HTMLInputElement | null;
    lastName: HTMLInputElement | null;
    email: HTMLInputElement | null;
    phoneNumber: HTMLInputElement | null;
    message: HTMLTextAreaElement | null;
  }>({
    firstName: null,
    lastName: null,
    email: null,
    phoneNumber: null,
    message: null,
  });
  const { toast } = useToast();
  const handleContact = useApiPost({
    type: "post",
    key: ["contact"],
    path: ApiRoutes.contact,
    sendingFile: false,
  });
  const handleSubmit = async () => {
    const firstName = formRefs.current.firstName?.value;
    const lastName = formRefs.current.lastName?.value;
    const email = formRefs.current.email?.value;
    const phoneNumber = formRefs.current.phoneNumber?.value;
    const message = formRefs.current.message?.value;
    if (
      [firstName, lastName, email, phoneNumber, message].some(
        (field) => field?.trim() === "",
      )
    ) {
      toast({
        title: "Error",
        description: "All fields are required",
        duration: 5000,
        variant: "error",
      });
    } else {
      const result = await handleContact.mutateAsync({
        firstName,
        lastName,
        email,
        phoneNumber,
        message,
      });
      if (result.status === 200) {
        Object.values(formRefs.current).forEach((field) => {
          if (field) field.value = "";
        });
        toast({
          title: "Success",
          description: "Message sent successfully",
          duration: 5000,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(handleContact),
          duration: 5000,
          variant: "error",
        });
      }
    }
  };
  return (
    <div className="w-full flex flex-col items-center justify-start p-6 pt-16 pb-28">
      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Get in <span className="text-purple-400">touch</span>
        </h1>
        <p className="text-white text-opacity-70 mt-2 text-lg">
          Reach out, and let's create a universe of possibilities together!
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full items-center ">
        {/* Contact Form */}
        <Card className="bg-[#1a1a2e] text-white w-full">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-1">
              Let’s connect constellations
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Let’s align our constellations! Reach out and let the magic of
              collaboration illuminate our skies.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                className="bg-[#0f0f1c] border-gray-600 text-white"
                ref={(el) => {
                  formRefs.current.firstName = el;
                }}
              />
              <Input
                placeholder="Last Name"
                className="bg-[#0f0f1c] border-gray-600 text-white"
                ref={(el) => {
                  formRefs.current.lastName = el;
                }}
              />
            </div>
            <Input
              placeholder="Email"
              className="mt-4 bg-[#0f0f1c] border-gray-600 text-white"
              ref={(el) => {
                formRefs.current.email = el;
              }}
              type="email"
            />
            <Input
              placeholder="Phone Number"
              className="mt-4 bg-[#0f0f1c] border-gray-600 text-white"
              ref={(el) => {
                formRefs.current.phoneNumber = el;
              }}
              type="tel"
              pattern="[0-9]{10}"
              maxLength={10}
              inputMode="numeric"
              title="Enter a 10-digit phone number"
            />
            <Textarea
              placeholder="Message"
              className="mt-4 bg-[#0f0f1c] border-gray-600 text-white"
              ref={(el) => {
                formRefs.current.message = el;
              }}
            />
            <Button
              className="mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full"
              onClick={handleSubmit}
              disabled={handleContact.isPending}
            >
              Send it to the moon 🚀
            </Button>
          </CardContent>
        </Card>

        {/* Astronaut Image */}
        <Card className="bg-[#1a1a2e] text-white w-full ">
          <CardContent className="p-0 flex flex-col justify-between h-full">
            <img
              src="https://letshost.imgix.net/assets/astronaut.png?fm=webp"
              alt="Astronaut"
              className="w-full object-cover rounded-t-xl max-h-80 sm:max-h-full"
            />
            <div className="p-4 text-sm italic text-gray-300">
              "Two lunar months revealed Earth's fragile beauty against vast
              silence, transforming my view of our place in the universe."
              <br />
              <span className="block mt-2 font-semibold">Irinel Traista</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
