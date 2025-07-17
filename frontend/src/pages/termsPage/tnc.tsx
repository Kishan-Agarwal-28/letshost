import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Terms and Conditions
          </CardTitle>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline">Effective Date:28 June 2025</Badge>
            <Badge variant="outline">Last Updated:28 June 2025</Badge>
          </div>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border-l-4 border-blue-400 dark:border-blue-500 mb-6">
            <p className="text-lg text-blue-800 dark:text-blue-200 mb-0">
              Welcome to LetsHost! We're excited to have you as part of our
              community. These Terms and Conditions help us create a positive
              experience for everyone using our website hosting, content
              delivery network (CDN), and AI-generated image sharing platform.
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-2 mb-0">
              By using our Service, you're agreeing to these terms, which help
              us maintain a great platform for all users. We've tried to make
              them as clear and fair as possible.
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">1. Service Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>LetsHost provides the following services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Website hosting solutions</li>
                <li>Content Delivery Network (CDN) services</li>
                <li>AI-generated image sharing platform</li>
                <li>Image generation tools using artificial intelligence</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                2. User Accounts and Creator Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  2.1 Getting Started
                </h4>
                <p>
                  When you create an account with LetsHost, we ask you to
                  provide accurate information so we can offer you the best
                  possible experience.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border-l-4 border-green-400 dark:border-green-500">
                <h4 className="font-semibold text-lg mb-2 text-green-800 dark:text-green-200">
                  2.2 Becoming a Creator
                </h4>
                <p className="text-green-700 dark:text-green-300 mb-0">
                  Here's something exciting - as soon as you share your first
                  AI-generated image with our community, you automatically
                  become a "Creator"! This gives you access to our credit system
                  and additional features to enhance your experience.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                3. AI-Generated Images and Content Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  3.1 Permitted Content
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Only AI-generated images may be shared on our platform
                  </li>
                  <li>
                    Images must comply with our community guidelines and
                    applicable laws
                  </li>
                  <li>
                    Users are prohibited from uploading photographs, hand-drawn
                    artwork, or any non-AI-generated content to the image
                    sharing section
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">3.2 Your Content</h4>
                <p>
                  When you share images on our platform, you still own your
                  creations! However, to operate our service effectively, you're
                  giving us permission to display and share your content as part
                  of the LetsHost community experience.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/50">
              <CardTitle className="text-xl text-orange-800 dark:text-orange-200">
                4. Credit System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2 text-green-800 dark:text-green-200">
                    4.1 Earning Credits
                  </h4>
                  <ul className="space-y-2 text-green-700 dark:text-green-300">
                    <li>
                      <strong>Contributions:</strong> You earn 0.5 credits for
                      each AI-generated image you successfully upload and share
                    </li>
                    <li>
                      <strong>Community Engagement:</strong> You earn 1 credit
                      for every 10 likes your images receive from other users
                    </li>
                    <li>
                      Credits are awarded automatically upon meeting the
                      specified criteria
                    </li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2 text-purple-800 dark:text-purple-200">
                    4.2 Using Credits
                  </h4>
                  <ul className="space-y-2 text-purple-700 dark:text-purple-300">
                    <li>
                      Credits are exclusively used for generating new AI images
                      through our platform
                    </li>
                    <li>
                      Credits cannot be transferred, sold, or exchanged for
                      monetary value
                    </li>
                    <li>
                      Credits do not expire but may be subject to periodic
                      adjustments at our discretion
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-lg border-l-4 border-yellow-400 dark:border-yellow-500">
                <h4 className="font-semibold text-lg mb-2 text-yellow-800 dark:text-yellow-200">
                  4.3 Important Note About Deletions
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 mb-0">
                  If you decide to delete an uploaded image, please note that 2
                  credits will be deducted from your account. This helps us
                  manage platform resources effectively. If your credit balance
                  goes negative, you may temporarily be unable to generate new
                  images until you earn more credits.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                5. Image Licensing and Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">5.1 Usage Rights</h4>
                <p>
                  Images shared on LetsHost are available for use under the
                  following conditions:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Images may be used for both personal and commercial purposes
                  </li>
                  <li>
                    Proper attribution to LetsHost is mandatory for all uses
                  </li>
                  <li>
                    <strong>Required attribution format:</strong> "Image
                    courtesy of LetsHost" or "Source: LetsHost"
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2 text-blue-800 dark:text-blue-200">
                  5.2 Simple Attribution
                </h4>
                <p className="text-blue-700 dark:text-blue-300 mb-0">
                  Our images are free to use for any purpose, and all we ask is
                  that you include a simple credit to LetsHost. This helps
                  others discover our community and supports the creators who
                  make these amazing images possible.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">6. Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  6.1 Creating a Positive Environment
                </h4>
                <p>
                  To keep LetsHost a welcoming space for everyone, we ask that
                  you avoid sharing content that could be harmful, offensive, or
                  violate laws. This includes respecting others' intellectual
                  property rights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  6.2 Being a Good Community Member
                </h4>
                <p>
                  We love having you as part of our community! Please treat
                  others with respect, use our tools responsibly, and help us
                  maintain a positive environment by reporting any concerning
                  content you might encounter.
                </p>
              </div>
            </CardContent>
          </Card>



          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                7. Privacy and Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Your privacy is important to us. Our use of your personal
                information is governed by our Privacy Policy, which is
                incorporated into these Terms by reference.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                8. Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">
                  8.1 Platform Rights
                </h4>
                <p>
                  LetsHost and its licensors own all rights, title, and interest
                  in and to the Service, including all intellectual property
                  rights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">9.2 User Content</h4>
                <p>
                  You retain ownership of content you create, subject to the
                  licenses granted to us under these Terms.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-xl text-red-800">
                9. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LETSHOST SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">10. Indemnification</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                You agree to indemnify and hold harmless LetsHost from any
                claims, damages, losses, or expenses arising from your use of
                the Service or violation of these Terms.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">11. Account Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                In rare cases where we need to suspend or close an account due
                to violations of our community guidelines, we'll do our best to
                communicate with you about the situation and work toward a
                resolution when possible.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-gray-50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-xl">12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you have any questions about these Terms, please contact us
                at:
              </p>
            <Link to="/contact-us" className="text-primary">Contact Us</Link>
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">13. Severability</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If any provision of these Terms is held to be invalid or
                unenforceable, the remaining provisions will remain in full
                force and effect.
              </p>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="bg-primary/10 p-6 rounded-lg text-center">
            <p className="text-lg font-semibold text-primary">
              By using LetsHost, you acknowledge that you have read, understood,
              and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsAndConditions;
