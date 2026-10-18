import { Routes, Route } from "react-router-dom";
import HomePage from "../Components/pages/Home";
import RegisterPage from "../Components/pages/register";
import LoginPage from "../Components/pages/login";
import AuthPage from "../Components/pages/authPage";
import FacultiesPage from "../Components/pages/Faculty/facultiesPage";
import SubjectsPage from "../Components/pages/Subject/SubjectsPage";
import RoomsPage from "../Components/pages/room/RoomsPage";
import ClassesPage from "../Components/pages/class/ClassesPage";
import TimetablesPage from "../Components/pages/TimeTable/TimetablesPage";
import GenerateTimetablePage from "../Components/pages/GenerateTimetablePage";
import GeneratedTimeTable from "../Components/pages/GeneratedTimeTable";
import FreeResourcesPage from "../Components/pages/FreeResourcesPage";
import AIDataExtraction from "../Components/pages/AIDataExtraction";


// Import the ProtectedRoute component
import ProtectedRoute from "../router/protectedRoutes";
import AddFacultyPage from "../Components/pages/Users/addFaculty";
import UsersPage from "../Components/pages/Users/usersPage";
import MySchedulePage from "../Components/pages/Faculty/FacultySchedule";

const Router = () => {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* --- Protected Routes (for any logged-in user) --- */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/view"
        element={
          <ProtectedRoute>
            <GeneratedTimeTable />
          </ProtectedRoute>
        }
      />

      {/* --- Admin-Only Protected Routes --- */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute adminOnly={true}>
            <FacultiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subject"
        element={
          <ProtectedRoute adminOnly={true}>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room"
        element={
          <ProtectedRoute adminOnly={true}>
            <RoomsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class"
        element={
          <ProtectedRoute adminOnly={true}>
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute adminOnly={true}>
            <TimetablesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate"
        element={
          <ProtectedRoute adminOnly={true}>
            <GenerateTimetablePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/addfaculty"
        element={
          <ProtectedRoute adminOnly={true}>
            <AddFacultyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly={true}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/free-resources"
        element={
          <ProtectedRoute adminOnly={true}>
            <FreeResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-extract"
        element={
          <ProtectedRoute adminOnly={true}>
            <AIDataExtraction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-schedule"
        element={
          <ProtectedRoute>
            <MySchedulePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default Router;
