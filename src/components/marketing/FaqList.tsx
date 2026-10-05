import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const defaultQuestions: [string, string][] = [
  ['What does TKO Motions build?', 'We design and build software systems, digital products, websites, automation and integrations around specific business needs.'],
  ['Do I need a fully defined project?', 'No. A clear description of the problem or opportunity is a useful place to start. We can help make the next step specific.'],
  ['Do you work with existing systems?', 'Yes. Where suitable, we work with existing products and services, and connect them through configuration or integrations.'],
  ['How do I discuss a project?', 'Use the project enquiry form or email temitopekehinde@tkomotions.com with a short description of what you are trying to change.'],
];

export function FaqList({ questions = defaultQuestions }: { questions?: readonly (readonly [string, string])[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {questions.map(([question, answer], index) => (
        <AccordionItem key={question} value={`faq-${index}`} className="border-b border-kh-rule">
          <AccordionTrigger className="py-4 text-left text-lg font-medium tracking-[-0.02em] hover:no-underline md:text-xl">
            {question}
          </AccordionTrigger>
          <AccordionContent className="pb-6 text-base leading-relaxed text-kh-muted">
            <p>{answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}