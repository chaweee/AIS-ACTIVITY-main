import * as ProfileService from '../services/profileService.js';

export const getStudentProfileById = async (req, res) => {
    try {
        const studentId = req.params.id;
        const adapterResponse = await ProfileService.fetchStudentByIdFromAdapter(studentId);
        
        if (!adapterResponse.success || !adapterResponse.data) {
            return res.status(404).json({
                success: false,
                message: "Student not found or Adapter layer returned an error."
            });
        }

        const student = adapterResponse.data;

        // Map the single legacy data object into a clean Student Parofile format
        const studentProfile = {
            profileId: student._id,
            fullName: student.name,
            dateOfBirth: student.birthdate,
            address: student.address,
            academicProgram: student.program,
            enrollmentStatus: student.studentStatus
        };

        res.status(200).json({
            data: studentProfile
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error while retrieving profile.",
            error: error.message
        });
    }
};