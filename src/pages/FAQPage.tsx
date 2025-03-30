
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center sticky top-0 z-10">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">FAQ</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm font-medium">
                  What is Cendy?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  Cendy is a campus-focused social network that connects students from the same university, 
                  allowing them to chat, share posts, and build community.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-sm font-medium">
                  How do I verify my university?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  You can verify your university by signing up with your university email address or 
                  uploading a valid student ID in the verification section of your profile.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-sm font-medium">
                  Can I use Cendy if I'm not a student?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  While Cendy is primarily designed for university students, anyone can join the platform. 
                  However, certain university-specific features may only be available to verified students.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-sm font-medium">
                  How do I report inappropriate content?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  You can report inappropriate content by clicking the three dots menu on any post or profile 
                  and selecting the "Report" option. Our moderation team will review all reports promptly.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-sm font-medium">
                  How do I delete my account?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  To delete your account, go to Settings &gt; Profile, and scroll to the bottom where you'll find 
                  the "Delete Account" option. Please note that account deletion is permanent and cannot be undone.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQPage;
