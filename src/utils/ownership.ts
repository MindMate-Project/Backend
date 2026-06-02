import { Types } from "mongoose";
import { Caregiver, IMongooseBaseUser } from "../models/User";

/**
 *  - admin     → always
 *  - patient   → only their own record
 *  - caregiver → only patients assigned to them
 *
 */
export const canAccessPatient = async (
  user: IMongooseBaseUser | undefined,
  patientId: string | Types.ObjectId | undefined | null
): Promise<boolean> => {
  if (!user || !patientId) return false;
  const pid = patientId.toString();

  if (user.role === "admin") return true;
  if (user.role === "patient") return String(user._id) === pid;

  if (user.role === "caregiver") {
    if (!Types.ObjectId.isValid(pid)) return false;
    const caregiver = await Caregiver.findById(user._id).select("patients");
    if (!caregiver) return false;
    return caregiver.patients.some(
      (ref: any) => ref?.patient && ref.patient.toString() === pid
    );
  }

  return false;
};

/**
 *  - patient   → just their own id
 *  - caregiver → their assigned patients
 *  - other     → none
 */
export const patientIdsFor = async (
  user: IMongooseBaseUser
): Promise<string[]> => {
  if (user.role === "patient") return [String(user._id)];
  if (user.role === "caregiver") {
    const caregiver = await Caregiver.findById(user._id).select("patients");
    return caregiver
      ? caregiver.patients
          .map((ref: any) => (ref?.patient ? String(ref.patient) : ""))
          .filter(Boolean)
      : [];
  }
  return [];
};
