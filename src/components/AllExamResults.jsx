import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const AllExamResults = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [editGrades, setEditGrades] = useState({});
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/results`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setResults(response.data.results);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching exam results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleGradeChange = (id, value) => {
    setEditGrades((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleGradeUpdate = async (result) => {
    const newGrade = editGrades[result._id];
    if (!newGrade) return;

    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.patch(
        `${API_BASE_URL}/api/results/update-grade`,
        {
          regdNo: result.regdNo,
          mobile: result.mobile,
          grade: newGrade,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUpdateStatus({ success: true, message: response.data.message });
        setEditGrades(" ")

      setResults((prev) =>
        prev.map((r) =>
          r._id === result._id
            ? {
                ...r,
                certificate: [
                  {
                    ...r.certificate?.[0],
                    grade: newGrade,
                  },
                ],
              }
            : r
        )
      );
    } catch (err) {
      setUpdateStatus({
        success: false,
        message: err.response?.data?.message || "Failed to update grade.",
      });
    }
  };

  const exportToExcel = () => {
  const dataToExport = results.map((result) => ({
    "Registration No": result.regdNo,
    "Candidate Name": result.certificate?.[0]?.candidateName || "N/A",
    "Mobile": result.mobile, 
    "Exam Date": result.certificate?.[0]?.examDate
      ? new Date(result.certificate[0].examDate).toLocaleDateString()
      : "N/A",
    "Percentage of Marks": result.certificate?.[0]?.grade || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Results");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, "Exam_Results.xlsx");
};


  if (loading) return <p>Loading exam results...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (results.length === 0) return <p>No exam results found.</p>;

   return (
    <div>
      <h2 className="text-2xl text-center mb-10 mt-5 font-bold">All Candidates Exam Results</h2>
        <button
    onClick={exportToExcel}
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center align-center mx-20 mb-4 cursor-pointer "
  >
    Export to Excel
  </button>
      <table className="table-auto border-collapse border border-gray-400 mx-20 w-[90%]">
        <thead>
          <tr className="bg-gray-200 text-gray-700 font-semibold">
            <th className="border border-gray-300 p-2">Registration No</th>
            <th className="border border-gray-300 p-2">Mobile</th>
            <th className="border border-gray-300 p-2">Candidate Name</th>
            <th className="border border-gray-300 p-2">Exam Date</th>
            <th className="border border-gray-300 p-2">percentage of Marks</th>
            <th className="border border-gray-300 p-2">Edit Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const currentGrade = result.certificate?.[0]?.grade || "";

            return (
              <tr key={result._id} className="text-gray-700 text-center">
                <td className="border border-gray-300 p-2">{result.regdNo}</td>
                <td className="border border-gray-300 p-2">{result.mobile}</td>
                <td className="border border-gray-300 p-2">
                  {result.certificate?.[0]?.candidateName || "N/A"}
                </td>
                <td className="border border-gray-300 p-2">
                  {result.certificate?.[0]?.examDate
                    ? new Date(result.certificate[0].examDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="border border-gray-300 p-2">{currentGrade || "N/A"}</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={editGrades[result._id] || ""}
                    onChange={(e) => handleGradeChange(result._id, e.target.value)}
                    className="border px-2 py-1 w-20"
                    placeholder="Enter Grade"
                  />
                  <button
                    onClick={() => handleGradeUpdate(result)}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    Update
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex justify-end mx-20 mb-4">
</div>

    </div>
  );

};

export default AllExamResults;
