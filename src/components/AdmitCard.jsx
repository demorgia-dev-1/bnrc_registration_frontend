
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

const AdmitCard = ({data}) => {
    const { id } = useParams(); // assumes /generate-admit-card/:id route
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState([]);
  
    const formFields = (data?.form?.sections || []).flatMap(
    (section) => section.fields || []
  );
  const responseMap = data?.responses || {};
  const uploadedFiles = data?.uploadedFiles || [];

  const fileMap = {};
  uploadedFiles.forEach((file) => {
    if (!fileMap[file.fieldName]) fileMap[file.fieldName] = [];
    fileMap[file.fieldName].push(file);
  });

  useEffect(() => {
  if (!id) {
    console.error("No id param provided");
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

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/files`);
        setUploadedFile(res.data.files || []);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, []);

  if (loading) return <p className="text-center">Loading Admit Card...</p>;

  if (!formData) return <p className="text-center text-red-500">Data not found.</p>;

  return (
    <div className="max-w-5xl mt-10 mx-auto p-6 border border-black bg-white text-sm font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 text-center">
        <img src="/BNRC.png" alt="Left Logo" className="w-20 h-20 object-contain" />
        <h2 className="text-lg font-bold uppercase">Competency Certification Admit Card</h2>
        <img src="/Health Dept.png" alt="Right Logo" className="w-20 h-20 object-contain" />
      </div>

      {/* Candidate Details */}
      <table className="w-full border border-black border-collapse mb-6">
        <thead>
          <tr className="bg-gray-200 text-center font-semibold">
            <td colSpan="4" className="border border-black p-2">CANDIDATE DETAILS</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">Candidate Name</td>
            <td colSpan="2" className="border border-black p-2">{formData.responses.first_name} {formData.responses.last_name}</td>
            <td rowSpan="4" className="border border-black p-2 text-center align-top">
  <div>Paste Passport Size Picture</div>
  <div className="border border-black mt-2 h-24 flex items-center justify-center text-xs">
  {fileMap["_passport-size_photograph"]?.[0]?._id ? (
    <img
      src={`${API_BASE_URL}/api/download/${fileMap["_passport-size_photograph"][0]._id}`}
      alt="Passport"
      className="w-full h-full object-cover"
    />
  ) : (
    "No image"
  )}
</div>

</td>


          </tr>
          <tr>
            <td className="border border-black p-2">Father’s Name</td>
            <td colSpan="2" className="border border-black p-2">Father's Full Name</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Date of Birth</td>
            <td colSpan="2" className="border border-black p-2">{formData.responses.dob}</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Registration Number</td>
            <td colSpan="2" className="border border-black p-2">{formData.responses.bnrc_registration_number}</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Gender</td>
            <td className="border border-black p-2">{formData.responses.gender}</td>
            <td className="border border-black p-2">Candidate Signature</td>
            <td className="border border-black p-2">
              <div className="border border-black h-12 flex items-center justify-center text-xs">
                Image of Signature from Registration Portal
              </div>
            </td>
          </tr>

          {/* Assessment Details */}
          <tr className="bg-gray-200 text-center font-semibold">
            <td colSpan="4" className="border border-black p-2">ASSESSMENT DETAILS</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Competency Certification Level</td>
            <td className="border border-black p-2">{formData.responses.dob}</td>
            <td className="border border-black p-2">Specialization</td>
            <td className="border border-black p-2">{formData.responses.competency_package_for_assessment}</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Type of Assessment</td>
            <td className="border border-black p-2">{formData.formName}</td>
            <td className="border border-black p-2">Exam Date</td>
            <td className="border border-black p-2">{formData.responses.exam_date_selection}</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Exam Time</td>
            <td className="border border-black p-2">HH:MM AM/PM</td>
            <td className="border border-black p-2">Reporting Time</td>
            <td className="border border-black p-2">HH:MM AM/PM</td>
          </tr>
          <tr>
            <td className="border border-black p-2">Exam Centre Name</td>
            <td className="border border-black p-2">{formData.responses.preferred_examination_center}</td>
            <td className="border border-black p-2">Exam Centre Address</td>
            <td className="border border-black p-2">Full Address of the Exam Centre</td>
          </tr>
        </tbody>
      </table>

      {/* Instructions */}
      <div>
        <h3 className="font-bold mb-2">INSTRUCTIONS</h3>
        <ol className="list-decimal pl-5 space-y-1 text-justify text-sm leading-relaxed">
          <li>Admit card must be printed on A4 size paper using a laser printer.</li>
          <li>Bring one valid photo ID proof to the exam center.</li>
          <li>Photo on ID must match the uploaded photo.</li>
          <li>This admit card is valid only for the assigned date/session.</li>
          <li>No requests for change in exam date/time/location will be entertained.</li>
          <li>Report at least 30 minutes before the exam time.</li>
          <li>Electronic gadgets are strictly prohibited inside the exam hall.</li>
          <li>Rough sheets will be provided in the exam hall.</li>
          <li>Entry is not allowed without a printed admit card.</li>
          <li>Any malpractice will lead to disqualification.</li>
          <li>Parents/Guardians are not allowed inside the exam premises.</li>
          <li>Follow COVID-19 protocols during the exam.</li>
        </ol>
      </div>
    </div>
  );
};

export default AdmitCard;
