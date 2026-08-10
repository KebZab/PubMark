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
}

interface ContractModalProps {
  contract: ContractData;
  onClose: () => void;
}

export function ContractModal({ contract, onClose }: ContractModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Modal toolbar — hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center">
              <ScrollText className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stall Occupancy Contract</p>
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

        {/* Contract document */}
        <div className="overflow-y-auto flex-1 bg-white">
          <div className="max-w-2xl mx-auto px-10 py-10 print:px-8 print:py-6">

            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
              <p className="text-xs font-semibold text-[#14B8A6] uppercase tracking-widest mb-1">Republic of the Philippines</p>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PubMark</h1>
              <p className="text-sm text-gray-500">Smart Public Market · Digital Mapping</p>
              <div className="mt-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Stall Occupancy Agreement</h2>
                <p className="text-sm text-gray-500 mt-1">Contract No.: PBM-{contract.applicationId}-{new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Preamble */}
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              This <strong>Stall Occupancy Agreement</strong> ("Agreement") is entered into as of <strong>{contract.approvedDate}</strong>, by and between:
            </p>

            {/* Parties */}
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lessor</p>
                <p className="font-semibold text-gray-900">PubMark Public Market Administration</p>
                <p className="text-sm text-gray-600">Public Market Management Office, PubMark Complex</p>
                <p className="text-xs text-gray-500 mt-1">(hereinafter referred to as the <em>"Administration"</em>)</p>
              </div>

              <div className="text-center font-bold text-gray-500 text-sm">— and —</div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lessee</p>
                <p className="font-semibold text-gray-900">{contract.applicantName}</p>
                <p className="text-sm text-gray-600">{contract.applicantAddress}</p>
                <p className="text-xs text-gray-500 mt-1">(hereinafter referred to as the <em>"Occupant"</em>)</p>
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-5 text-sm text-gray-700 leading-relaxed">

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">I</span>
                  Premises
                </h3>
                <p>
                  The Administration hereby grants the Occupant the right to occupy and operate within the following stall:
                </p>
                <div className="mt-2 ml-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div><span className="text-gray-500">Stall Number:</span> <strong>{contract.stallName}</strong></div>
                  <div><span className="text-gray-500">Section:</span> <strong>Section {contract.stallSection}</strong></div>
                  <div><span className="text-gray-500">Floor Area:</span> <strong>{contract.floorArea}</strong></div>
                  <div><span className="text-gray-500">Location:</span> <strong>PubMark Public Market</strong></div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">II</span>
                  Term
                </h3>
                <p>
                  This Agreement shall commence on <strong>{contract.startDate}</strong> and shall expire on <strong>{contract.endDate}</strong>, unless earlier terminated in accordance with the provisions herein.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">III</span>
                  Use of Premises
                </h3>
                <p>
                  The Occupant shall use the leased stall solely for the lawful operation of a <strong>{contract.businessType}</strong> business under the registered name <strong>"{contract.businessName}"</strong>. Any change in business nature requires prior written approval from the Administration.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">IV</span>
                  Obligations of the Occupant
                </h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Maintain the stall in clean, sanitary, and orderly condition at all times.</li>
                  <li>Comply with all market rules, regulations, and ordinances.</li>
                  <li>Keep the stall open during official market operating hours.</li>
                  <li>Not sublease, assign, or transfer occupancy rights without written consent.</li>
                  <li>Secure all required government permits and licenses for the business operation.</li>
                  <li>Not make permanent structural modifications without written approval.</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">V</span>
                  Obligations of the Administration
                </h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ensure the stall is in habitable and usable condition upon turnover.</li>
                  <li>Maintain common areas, walkways, and basic market facilities.</li>
                  <li>Provide reasonable notice prior to any inspections.</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">VI</span>
                  Termination
                </h3>
                <p>
                  Either party may terminate this Agreement upon <strong>thirty (30) days</strong> prior written notice. The Administration may terminate immediately in cases of violation of market rules, abandonment, or use of the stall for illegal activities.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#14B8A6] text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">VII</span>
                  Governing Law
                </h3>
                <p>
                  This Agreement shall be governed by the laws of the Republic of the Philippines and applicable local ordinances of the municipality.
                </p>
              </div>
            </div>

            {/* Signature block */}
            <div className="mt-10 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-700 mb-8">
                <strong>IN WITNESS WHEREOF</strong>, the parties hereto have signed this Agreement on the date first written above.
              </p>

              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-xs text-gray-500 mb-12">Administration Representative</p>
                  <div className="border-b border-gray-800 mb-2"></div>
                  <p className="text-sm font-semibold text-gray-900">Market Administrator</p>
                  <p className="text-xs text-gray-500">PubMark Administration</p>
                  <p className="text-xs text-gray-400 mt-2">Date: _______________</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-12">Occupant</p>
                  <div className="border-b border-gray-800 mb-2"></div>
                  <p className="text-sm font-semibold text-gray-900">{contract.applicantName}</p>
                  <p className="text-xs text-gray-500">{contract.businessName}</p>
                  <p className="text-xs text-gray-400 mt-2">Date: _______________</p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                  Signed before me this _______ day of _____________, _______ at _________________________.
                </p>
                <div className="mt-6 text-center">
                  <div className="inline-block border-b border-gray-800 w-48 mb-1"></div>
                  <p className="text-xs text-gray-500">Notary Public</p>
                  <p className="text-xs text-gray-400">Doc. No. _____ · Page No. _____ · Book No. _____ · Series of _____</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
