/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddJersey from './pages/AddJersey';
import AdminPanel from './pages/AdminPanel';
import Chat from './pages/Chat';
import Datenschutz from './pages/Datenschutz';
import EditJersey from './pages/EditJersey';
import EditSiteContent from './pages/EditSiteContent';
import Home from './pages/Home';
import Impressum from './pages/Impressum';
import JerseyDetail from './pages/JerseyDetail';
import ManageUsers from './pages/ManageUsers';
import Messages from './pages/Messages';
import MyCollection from './pages/MyCollection';
import MyPurchases from './pages/MyPurchases';
import Settings from './pages/Settings';
import Share from './pages/Share';
import UserProfile from './pages/UserProfile';
import UserPurchases from './pages/UserPurchases';
import UpdateLog from './pages/UpdateLog';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddJersey": AddJersey,
    "AdminPanel": AdminPanel,
    "Chat": Chat,
    "Datenschutz": Datenschutz,
    "EditJersey": EditJersey,
    "EditSiteContent": EditSiteContent,
    "Home": Home,
    "Impressum": Impressum,
    "JerseyDetail": JerseyDetail,
    "ManageUsers": ManageUsers,
    "Messages": Messages,
    "MyCollection": MyCollection,
    "MyPurchases": MyPurchases,
    "Settings": Settings,
    "Share": Share,
    "UserProfile": UserProfile,
    "UserPurchases": UserPurchases,
    "UpdateLog": UpdateLog,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};