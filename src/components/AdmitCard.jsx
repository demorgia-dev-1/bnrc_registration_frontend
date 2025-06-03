import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

const AdmitCard = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const admitCardRef = useRef();

  useEffect(() => {
    if (!id) {
      console.error("No ID param provided");
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/admit-card/generate-admit-card/${id}`)
      .then((res) => {
        setFormData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching admit card data:", err);
        setLoading(false);
      });
  }, [id]);


  if (loading) return <p className="text-center">Loading Admit Card...</p>;

  if (!formData)
    return <p className="text-center text-red-500">Data not found.</p>;

  const responses = formData.responses || {};
  const uploadedFiles = formData.uploadedFiles || [];

  const passportPhoto = uploadedFiles.find(
    (file) =>
      file.originalName?.toLowerCase().includes("passport") ||
      file.fieldName === "_passport-size_photograph" ||
      file.contentType?.startsWith("image")
  );

  return (

    <table className="max-w-5xl mt-10 mx-auto p-6 border border-black bg-white text-sm font-sans">
      <thead>
        <tr>
          <td className="border border-black p-2 text-center w-1/6">
            <div className="flex justify-center">
              <img
                src="/BNRC.png"
                alt="Left Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </td>
          <td className="border border-black p-2 text-center w-4/6" colSpan="5">
            <h2 className="text-lg font-bold uppercase">
              Competency Certification Admit Card
            </h2>
          </td>
          <td className="border border-black p-2 text-center w-1/6">
            <div className="flex justify-center">
              <img
                src="/Health Dept.png"
                alt="Right Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        {/* Candidate Details Header */}
        <tr className="bg-gray-200 text-center font-semibold">
          <td colSpan="9" className="border border-black p-2">
            CANDIDATE DETAILS
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">Candidate Name</td>
          <td colSpan="3" className="border border-black p-2">
            {responses.first_name} {responses.last_name}
          </td>
          <td
            colSpan="2"
            rowSpan="5"
            className="border border-black p-2 text-center align-top"
          >
            <div className="border border-black mt-2 h-40 px-2 text-center flex justify-center items-center text-xs">
              Paste Passport Size Photo (Candidate to paste here)
            </div>
          </td>
          <td
            colSpan="5"
            rowSpan="5"
            className="border border-black p-2 text-center align-top"
          >
            <div className="border border-black mt-2 h-40 flex items-center justify-center text-xs">
              {passportPhoto ? (
                <img
                  src={`${API_BASE_URL}/api/download/${
                    passportPhoto.fileId || passportPhoto._id
                  }`}
                  alt="Passport"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback.png";
                  }}
                />
              ) : (
                "No image"
              )}
            </div>
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">Father’s Name</td>
          <td colSpan="3" className="border border-black p-2">
            {responses["father's_name"]}
          </td>
        </tr>
        <tr>
          <td className="border border-black p-2">Date of Birth</td>
          <td colSpan="3" className="border border-black p-2">
            {responses.dob}
          </td>
        </tr>
        <tr>
          <td className="border border-black p-2">Registration Number</td>
          <td colSpan="3" className="border border-black p-2">
            {responses.bnrc_registration_number}
          </td>
        </tr>
        <tr>
          <td className="border border-black p-2">Gender</td>
          <td colSpan="3" className="border border-black p-2">
            {responses.gender}
          </td>
        </tr>

        {/* Assessment Details Header */}
        <tr className="bg-gray-200 text-center font-semibold">
          <td colSpan="9" className="border border-black p-2">
            ASSESSMENT DETAILS
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">
            Competency Certification Level
          </td>
          <td className="border border-black p-2">Level A</td>
          <td className="border border-black p-2">Specialization</td>
          <td className="border border-black p-2">
            {responses.competency_package_for_assessment}
          </td>
          <td
            colSpan="2"
            rowSpan="4"
            className="border border-black p-2 text-center align-top"
          >
            <div className="border border-black mt-2 w-full h-40 flex items-center justify-center text-xs">
              Candidate Signature
            </div>
          </td>
          <td
            colSpan="2"
            rowSpan="4"
            className="border border-black p-2 text-center align-top"
          >
            <div className="border border-black mt-2 w-full h-40 flex items-center justify-center text-xs">
              {uploadedFiles?.length > 1 ? (
                <img
                  src={`${API_BASE_URL}/api/download/${
                    uploadedFiles[1]?.fileId || uploadedFiles[1]?._id
                  }`}
                  alt="Signature"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback.png";
                  }}
                />
              ) : (
                <span>No image</span>
              )}
            </div>
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">Type of Assessment</td>
          <td className="border border-black p-2">CBT</td>
          <td className="border border-black p-2">Exam Date</td>
          <td className="border border-black p-2">
            {responses.exam_date_selection}
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">Exam Time</td>
          <td className="border border-black p-2">11:00 AM</td>
          <td className="border border-black p-2">Reporting Time</td>
          <td className="border border-black p-2">10:00 AM</td>
        </tr>

        <tr>
          <td className="border border-black p-2">Exam Centre Name</td>
          <td className="border border-black p-2" colSpan="3">
            {responses.preferred_examination_center}
          </td>
        </tr>

        <tr>
          <td className="border border-black p-2">Exam Centre Address</td>
          <td colSpan="7" className="border border-black p-2">
            GNM Nursing Institute, Nalanda Medical College and Hospital (NMCH),
            Agamkuan, Patna -800007
          </td>
        </tr>
      </tbody>

      {/* Instructions Section */}
      <tfoot>
        <tr>
          <td colSpan="9" className="border border-black p-0">
            <div className="w-full mb-0">
              <h3 className="font-bold text-center border-b border-black py-2 bg-gray-100">
                INSTRUCTIONS
              </h3>
              <table className="w-full border-t-0">
                <tbody>
                  {[
                    "Admit Card must be printed on A4 size paper using a laser printer. The Admit Card is valid only if the candidate’s photograph and signature are clearly printed and not smudged or damaged.",
                    "Candidates should bring the admit card along with any one of the following valid photo ID proof (original). (Aadhaar Card/Voter ID Card/PAN Card/Passport/Driving License/any other Govt approved photo ID). The name on the photo ID should be the same as that on the Admit card.",
                    "In case of any discrepancy in the photograph, candidate should bring one recent passport size photograph.",
                    "This Admit Card is valid only for the test date and session mentioned on it. It cannot be used for any other session or centre & is valid only on the exam date and time.",
                    "No request for change in examination centre, date, or session will be entertained under any circumstances.",
                    "Candidates will not be allowed to enter the test centre after the gate closure time (10:30 AM). Candidates must report to the test centre by 30 minutes before the commencement of examination. Entry into the test centre will not be allowed after reporting time mentioned above.",
                    "Admit Card is provisional, subject to the condition that the candidate fulfils all eligibility criteria as mentioned in the official notification. Candidature is liable to be cancelled at any stage if found ineligible.",
                    "Possession and use of electronic devices/jewelry/jackets/calculators/watch or items containing metal are strictly prohibited inside the test centre premises. Simple dressing with plain cardigans/sweaters are recommended. A rough sheet will be provided to candidates.",
                    "At test centre entry you have to undergo a mandatory frisking activity, objectionable item (if any) is identified, you would be requested to leave it behind before entering the test centre. Candidates showing non-cooperation may get barred from appearing for the test.",
                    "Guardians/relatives/friends accompanying the candidates are not allowed inside the test centre.",
                    "No malpractice will be tolerated inside the test centre. Decision of venue officials will be final.",
                    "Follow all COVID-19 protocols if applicable.",
                  ].map((text, idx) => (
                    <tr key={idx}>
                      <td className="border-t border-black p-2 text-justify text-sm leading-relaxed">
                        <span className="font-semibold">{idx + 1}.</span> {text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
};

export default AdmitCard;
