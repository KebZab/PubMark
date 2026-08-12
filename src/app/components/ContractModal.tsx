import { Fragment, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ScrollText } from "lucide-react";

export interface ContractData {
  applicationId: string;
  stallName: string;
  stallSection: string;
  floorArea: string;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  businessType: string;
  startDate: string;
  endDate: string;
  approvedDate: string;
  contractTermMonths: string;
}

const TERM_TEXT: Record<string, string> = {
  "6": "six (6) months",
  "12": "one (1) year",
  "24": "two (2) years",
  "36": "three (3) years",
};

function formatTermText(months: string) {
  return TERM_TEXT[months] ?? `${months} month(s)`;
}

interface ContractModalProps {
  contract: ContractData;
  onClose: () => void;
}

function formatLongDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMediumDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ArticleHeading({ article, title }: { article: string; title: string }) {
  return (
    <div className="text-center mt-8 mb-5">
      <p className="text-[15px] font-bold tracking-wide uppercase">{article}</p>
      <p className="text-[15px] font-bold tracking-wide uppercase">{title}</p>
    </div>
  );
}

function NumberedClause({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5 break-inside-avoid">
      <p className="text-[14px] leading-[1.45]">
        <span className="font-bold mr-2">{number}</span>
        <span className="font-bold">{title}</span>
        <span className="font-normal"> {children}</span>
      </p>
    </div>
  );
}

function InlineBlank({ value, className = "" }: { value?: string; className?: string }) {
  return (
    <span className={`inline-block border-b border-black align-baseline min-w-[180px] px-2 text-center ${className}`}>
      {value ?? "\u00A0"}
    </span>
  );
}

function ContractPage({
  pageNumber,
  children,
}: {
  pageNumber: number;
  children: ReactNode;
}) {
  return (
    <section
      className="contract-page bg-white text-black mx-auto mb-6 print:mb-0"
      style={{ pageBreakAfter: "always" }}
    >
      <div className="min-h-[1122px] w-full px-[68px] py-[54px] print:min-h-0">
        {children}
        <div className="mt-10 text-center text-[14px] print:break-before-avoid">-{pageNumber}-</div>
      </div>
    </section>
  );
}

export function ContractModal({ contract, onClose }: ContractModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const approvedDate = formatLongDate(contract.approvedDate);
  const startDate = formatMediumDate(contract.startDate);
  const endDate = formatMediumDate(contract.endDate);
  const businessType = toTitleCase(contract.businessType || "business");
  const termText = formatTermText(contract.contractTermMonths);

  return (
    <Fragment>
      {createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200 print:static print:block print:p-0 print:bg-transparent print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:block">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center">
              <ScrollText className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Contract Of Lease</p>
              <p className="text-xs text-gray-500">Application #{contract.applicationId} · Ready to print</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md hover:scale-105 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Contract
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 bg-[#f5f1e8] print:bg-white print:overflow-visible print:h-auto">
          <div className="mx-auto max-w-[920px] px-6 py-8 print:px-0 print:py-0">
            <style>{`
              @media print {
                @page { size: A4; margin: 12mm; }
                #root { display: none !important; }
                body * { visibility: hidden; }
                .contract-root, .contract-root * { visibility: visible; }
                .contract-root {
                  width: 100%;
                  background: white;
                }
                .contract-page {
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  width: 100% !important;
                }
              }
            `}</style>

            <div className="contract-root font-serif text-[14px] leading-[1.45] text-black">
              <ContractPage pageNumber={1}>
                <div className="text-center mb-12">
                  <h1 className="text-[24px] font-bold uppercase underline underline-offset-4">Contract Of Lease</h1>
                </div>

                <div className="space-y-5 text-[14px]">
                  <p className="text-[16px] uppercase">Know All Men By These Presents:</p>

                  <p>This Contract of Lease, made and entered into, by and between:</p>

                  <p>
                    The Municipality of Murcia, Negros Occidental, and thru <strong>SB Resolution No. 2015-049</strong> herein
                    represented by its Local Chief Executive, <strong>VICTOR GERARDO M. ROJAS</strong>, of legal age, Filipino, and a
                    resident of Murcia, Negros Occidental, Philippines, hereinafter referred to as the <strong>&ldquo;LESSOR&rdquo;</strong>.
                  </p>

                  <p className="text-center">-and-</p>

                  <p>
                    <InlineBlank value={contract.applicantName} className="min-w-[290px]" />, of legal age, Filipino, and a resident of{" "}
                    <InlineBlank value={contract.applicantAddress} className="min-w-[320px]" />, doing business under the name and style{" "}
                    <InlineBlank value={contract.businessName} className="min-w-[260px]" />,
                  </p>

                  <p>
                    OR a domestic corporation duly organized and existing under and by virtue of the laws of the Republic of the Philippines,
                    with principal office at <InlineBlank className="min-w-[210px]" />, and represented this act by its{" "}
                    <InlineBlank className="min-w-[190px]" />.
                  </p>

                  <p>
                    <InlineBlank className="min-w-[130px]" />, or <InlineBlank className="min-w-[220px]" /> a partnership duly organized
                    and existing under and by virtue of the laws of the Republic of the Philippines, hereinafter referred to as{" "}
                    <strong>&ldquo;LESSEE&rdquo;</strong>
                  </p>
                </div>

                <div className="text-center mt-12 mb-8">
                  <p className="text-[16px] font-bold uppercase">Witnesseth; that -</p>
                </div>

                <div className="space-y-5">
                  <p>
                    <strong>WHEREAS,</strong> the LESSOR is the registered owner of a building known as{" "}
                    <InlineBlank value={`Stall ${contract.stallName}`} className="min-w-[170px]" /> situated at{" "}
                    <InlineBlank value={`Section ${contract.stallSection}, Murcia`} className="min-w-[220px]" /> Philippines.
                  </p>

                  <p>
                    <strong>WHEREAS,</strong> the LESSOR desires to lease out a portion of the afore-described property in favor of the
                    LESSEE and the LESSEE accepts the lease subject to the terms and the conditions herein set forth.
                  </p>

                  <p>
                    <strong>NOW, THEREFORE,</strong> for and in consideration of the foregoing premises and the covenants hereinafter
                    stipulated, the parties hereby agree as follows:
                  </p>
                </div>
              </ContractPage>

              <ContractPage pageNumber={2}>
                <ArticleHeading article="ARTICLE I" title="PROPERTIES FOR LEASE" />

                <NumberedClause number="1." title="The LESSOR hereby transfer and conveys by way of LEASE favor of the LESSEE">
                  a portion of the afore-stated properties (hereinafter referred to as the leased properties) specifically described as
                  allows:
                </NumberedClause>

                <div className="ml-10 mb-6">
                  <div className="grid grid-cols-2 gap-8 text-center mb-2">
                    <p className="underline font-semibold">Bldg Portion</p>
                    <p className="underline font-semibold">App. Covered Flr. Area</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <p className="border-b border-black text-center pb-1">{contract.stallName}</p>
                    <p className="border-b border-black text-center pb-1">{contract.floorArea}</p>
                  </div>
                </div>

                <NumberedClause number="2." title="Inspection; No Warranty:">
                  The LESSOR leases the Leased Properties to the LESSEE on an &ldquo;AS IS, WHERE IS&rdquo; basis. The LESSEE hereby
                  declares that it has inspected the Leased Properties prior to the execution of this Lease Agreement, and acknowledges that
                  is fully satisfied with the conditions thereof. The LESSOR makes no warranty as to the condition, operational or structural
                  capability, or as to any hidden defects of the Property which the LESSEE warrants to know by virtue of the LESSEE&rsquo;S
                  duty to inspect.
                </NumberedClause>

                <NumberedClause number="3." title="Condition Precedent:">
                  It is a condition precedent for the effectivity of this Lease Agreement that the LESSEE submits to the LESSOR the
                  following:
                </NumberedClause>

                <div className="space-y-4 pl-8">
                  <p>
                    For corporations: A copy of its articles of incorporation and By-laws and latest General Information sheet including a
                    Board Resolution specifically authorizing the corporation and the person representing the same in this instance to enter
                    into lease agreement with the LESSOR under the terms and conditions contained herein;
                  </p>
                  <p>
                    For partnership: A copy of its Articles of Partnership, registration with the Department of Trade and Industry, and
                    Special Power of Attorney of the person representing the same the same in this instance tc enter into this lease
                    agreement with the LESSOR under the terms and conditions contained herein.
                  </p>
                  <p>
                    Other: The Lessee hereby recognizes the validity of all resolutions, ordinances and executive orders referring to the
                    rentals provided therein and the regularity in the performance of the elective and appointive officials of the LESSOR in
                    the implementation of these resolutions, ordinances and executive order. The Lessee further certifies that in so far as
                    he/she/it is concerned; all questions or issues raised relative to the validity, legality and justness of the rentals
                    fixed by the municipal authorities are ready deemed resolved and all municipal officials who enforced the same are hereby
                    cleared of whatever liability by reason hereof.
                  </p>
                  <p>
                    Voluntary Undertaking: The Lessee hereby voluntarily declares that all representations that he/she made herein are true
                    and correct to the best of his/her knowledge and that the same may be used as evidence in all proceedings of whatever
                    nature against him/her.
                  </p>
                </div>
              </ContractPage>

              <ContractPage pageNumber={3}>
                <ArticleHeading article="ARTICLE II" title="CONSIDERATION" />

                <NumberedClause number="1." title="Rental Payment-">
                  Within the five (5) days of each calendar month, the LESSEE shall pay the LESSOR a monthly rent at the rate of{" "}
                  <InlineBlank className="min-w-[180px]" /> (<InlineBlank className="min-w-[150px]" />) per square meter or the total
                  amount of <InlineBlank className="min-w-[200px]" /> (P <InlineBlank className="min-w-[150px]" />).
                </NumberedClause>

                <NumberedClause number="2." title="Advance Rental Payment-">
                  On or before <InlineBlank className="min-w-[180px]" />, the LESSEE shall remit to the LESSOR an amount equivalent to ONE
                  (1) month rent or the total sum of <InlineBlank className="min-w-[180px]" /> (P <InlineBlank className="min-w-[150px]" />
                  ).
                </NumberedClause>

                <NumberedClause number="3." title="Security Deposit -">
                  On or before <InlineBlank className="min-w-[180px]" />, the LESSEE shall remit to the LESSOR an amount equivalent to
                  THREE (3) months rent or <InlineBlank className="min-w-[200px]" /> (P <InlineBlank className="min-w-[150px]" />) to
                  serve as Security deposit for any unpaid utility bills such as electricity, water, telephone, sanitation, sewerage and
                  others, and to answer for any damages which the Leased Properties may suffer as well as to cover any unpaid monthly rent,
                  interest or penalties. This amount is refundable to the LESSEE free of any interest thirty (30) days after the
                  termination of this Lease Agreement subject to the deduction for whatever utility bills and monthly rentals, interest,
                  penalties that have remained unpaid and damages that may have been incurred, provided, that the LESSEE shall still be
                  liable for any and all bills, rentals, interest, penalties and damages that may exceed this security deposit. The LESSEE
                  shall not be allowed to offset or use its security deposit as its monthly rental payment.
                </NumberedClause>

                <NumberedClause number="4." title="Unpaid Rentals -">
                  Upon failure of the LESSEE to pay rentals for two (2) months, the LESSOR or its authorized representative(s) shall have
                  the right, upon five (5) days written notice to the LESSEE, or upon written notice posted at the entrance of the leased
                  Properties for the same period, to padlock the leased premises, to enter and take possession of said premises, without
                  need of resorting to any court action, holding, taking custody and impounding such possession and belongings of the
                  LESSEE found therein after conducting an inventory of the same in the presence of witnesses, until such time that all the
                  rentals, interest, penalties, damages or other amounts due to the LESSOR has been fully settled by the LESSEE. All these
                  acts being hereby agreed to by the LESSEE as tantamount to his voluntary vacation of the leased premises without necessity
                  of suit in court and authorizing LESSOR to use all necessary and reasonable force to break open doors and to enter the
                  premises and take actual possession thereof, and such entry and reasonable force should not be regarded as trespass nor be
                  used as such, or in any wise be considered as unlawful.
                </NumberedClause>
              </ContractPage>

              <ContractPage pageNumber={4}>
                <ArticleHeading article="ARTICLE III" title="TERM OF LEASE" />

                <NumberedClause number="1." title="TERM-">
                  Unless earlier terminated for reasons specified herein, the term of the leased Agreement shall be for {termText} to
                  start on <InlineBlank value={startDate} className="min-w-[180px]" /> And end at noontime on{" "}
                  <InlineBlank value={endDate} className="min-w-[180px]" />, subject to negotiation subject to the LESSEE having the option
                  of the first refusal.
                </NumberedClause>

                <p className="mb-8 ml-8">
                  The lease contract sought for modification be in writing and that all other miscellaneous Expenses in newly appropriate
                  documentation thereon shall be shouldered by the lessee;
                </p>

                <ArticleHeading article="ARTICLE IV" title="PURPOSE OF THE LEASE" />

                <NumberedClause number="1." title="Use of the Leases Properties -">
                  The LESSEE shall use the Leased Properties strictly and exclusively as <InlineBlank value={businessType} className="min-w-[140px]" />
                  , if the Leased properties are used for other purposes, Sub-the LESSOR has the choice to,
                </NumberedClause>

                <div className="pl-14 mb-6 space-y-1">
                  <p>(i) Rescind the lease Agreement and evict the LESSEE or</p>
                  <p>(ii) Increase the rent or</p>
                  <p>(iii) Compel the LESSEE to: stop the new activities</p>
                </div>

                <p className="mb-6 ml-8">
                  In no case shall the Leased Properties to be used for information or illicit purposes and illegal acts of purposes.
                </p>

                <NumberedClause number="2." title="Sub-Lease-">
                  The LESSEE may not sub - lease the Leased Properties. Any volition shall be a ground for AUTOMATIC rescission of this
                  LEASE Agreement without prejudice to perpetual prohibition for the LESSEE to enter into any Lease Contract with any
                  properties of the LESSOR.
                </NumberedClause>

                <ArticleHeading article="ARTICLE V" title="CANCELLATION" />

                <NumberedClause number="1." title="Surcharge-">
                  In the event LESSEE fails to pay its monthly rent within that first five (5) days of each month, a surcharge of TWENTY
                  FIVE PERCENT (25%) on the total amount due shall be charged.
                </NumberedClause>

                <ArticleHeading article="ARTICLE VI" title="CANCELLATION" />

                <NumberedClause number="1." title="Grounds for Cancellation -">
                  The LESSOR may cancel or terminate this lease Agreement upon. The happening of any of the following events:
                </NumberedClause>

                <div className="pl-8 space-y-1">
                  <p>2.1 The LESSEE fails to pay its monthly rent when the same fails due.</p>
                  <p>
                    2.2 The LESSEE uses the Leased Properties for purposes other than those specified herein, without prejudice to the
                    options available Lessor under Section 1 Article iv hereof.
                  </p>
                </div>
              </ContractPage>

              <section
                className="contract-page bg-white text-black mx-auto"
                style={{ pageBreakAfter: "always" }}
              >
                <div className="min-h-[1122px] w-full px-[68px] py-[54px] print:min-h-0">
                  <div className="space-y-5">
                    <p>
                      (ii) For any damage done or occasioned by or arising from the plumbing, gas, water, and/or other pipes or air
                      conditioning system or for the bursting, leaking or destruction of any tank, cistern, washers, and water closets or
                      waste pipelines in above, upon or about said Leased Properties, nor for any damage arising from or attributable to
                      acts of negligence of the LESSEE or its agents, employees, representatives or any and all other persons over which the
                      LESSOR has no control.
                    </p>
                  </div>

                  <NumberedClause number="13." title="Non Waiver-">
                    The failure of the LESSOR to insist upon a strict performance of any of the term, conditions and covenants hereof shall
                    not be deemed a relinquishment or waiver of any of the rights or remedies that the LESSOR may have nor shall it be
                    construed as a waiver of any subsequent break or default of its terms, conditions and covenants which shall continue to
                    be in full force and effect, No waiver by the LESSOR of its rights under this Lease Agreement shall deemed to have been
                    made unless expressed in writing and signed by the LESSOR.
                  </NumberedClause>

                  <NumberedClause number="14." title="Member clause-">
                    As a cancellation of continuance of this lease, the LESSEE shall be a member in good standing of any Murcia local
                    government accredited vendor or business association. It is hereby explicitly understood that the voluntary resignation
                    or expulsion of the Lessee from the accredited association shall be a just cause for terminating this Lease. The term
                    &ldquo;members in good standing&rdquo; shall mean that the LESSEE shall pay all his/her/its membership fees and other
                    assessments established by the accredited association abide with the constitution, by-laws, rule and regulations and
                    policies laid down by the he accredited association.
                  </NumberedClause>

                  <NumberedClause number="15." title="Conciliation proceedings-">
                    Grievances, cases or issues relating to enforcement of market policies and fixing of rental rates rules shall firs be
                    submitted to the Joint Economic Enterprise and Development council (JEEDC) for conciliation before a complaint or action
                    is filed in court or any investigative agency of the government. Cases of this nature that do not pass through
                    conciliation proceedings with JEEDC, including those which were already filed or yet to be filed by herein Lessee,
                    shall thereupon be dropped or dismissed for failure to exhaust administrative remedies, lack of cause of action or
                    pre-maturity.
                  </NumberedClause>

                  <NumberedClause number="16." title="Amendments-">
                    Any amendments or additional terms and conditions to this lease Agreement must be writing.
                  </NumberedClause>

                  <NumberedClause number="17." title="Separability clause-In">
                    case any provision hereof is declared void or unenforceable by a competent court, all other provisions not affected
                    thereby shall remain valid, effective and binding.
                  </NumberedClause>

                  <div className="mt-10 text-center text-[14px]">-8-</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )}
    </Fragment>
  );
}
