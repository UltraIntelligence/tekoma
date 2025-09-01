export const projectData = {
  phases: [
    {
      id: 'phase1',
      title: 'Phase 1: Critical Fixes & Content Preparation',
      tasks: [
        { id: 'p1t1', code: 'G-FIX', title: 'Project Location Correction 1/9 (Kasama)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t2', code: 'G-FIX', title: 'Project Location Correction 2/9 (Daisen)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t3', code: 'G-FIX', title: 'Project Location Correction 3/9 (Hitachiomiya)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t4', code: 'G-FIX', title: 'Project Location Correction 4/9 (Daigo)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t5', code: 'G-FIX', title: 'Project Location Correction 5/9 (Kato A)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t6', code: 'G-FIX', title: 'Project Location Correction 6/9 (Kamigori)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t7', code: 'G-FIX', title: 'Project Location Correction 7/9 (Tatsuno)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t8', code: 'G-FIX', title: 'Project Location Correction 8/9 (Kato C)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t9', code: 'G-FIX', title: 'Project Location Correction 9/9 (Yonago)', time: 5, source: 'Kawasaki Memo', justification: '既存公式HP 誤記訂正箇所. Accuracy is critical for Japanese market credibility.' },
        { id: 'p1t10', code: 'G-FIX', title: 'Contact Page: Update Google Maps Pin', time: 15, source: 'Ricardo Meeting', justification: 'The Google Map is incorrect. Address changed one year ago but was never updated.' },
        { id: 'p1t11', code: 'R-FIX', title: 'Careers Page: Remove Outdated Job Postings', time: 15, source: 'Gerard Meeting', justification: 'Same job postings from three years ago still displayed.' }
      ]
    },
    {
      id: 'phase2',
      title: 'Phase 2: Navigation & Structural Overhaul',
      tasks: [
        { id: 'p2t1', code: 'G-FIX', title: 'Navigation: Hide "Home" Link', time: 15, source: 'Gerard Email', justification: 'Logo serves as home link - redundant menu item.' },
        { id: 'p2t2', code: 'G-FIX', title: 'Navigation: Delete "Services" Page', time: 15, source: 'Gerard Email', justification: 'Services content should be integrated into landing page.' },
        { id: 'p2t3', code: 'G-FIX', title: 'Navigation: Set up URL Redirect', time: 15, source: 'Best Practices', justification: 'Preserve SEO value and prevent broken links.' },
        { id: 'p2t4', code: 'G-FIX', title: 'Navigation: Delete "Members" Page', time: 15, source: 'Gerard Email', justification: 'Members section no longer needed.' },
        { id: 'p2t5', code: 'R-NEW', title: 'Navigation: Elevate Contact to Main Menu', time: 15, source: 'UX Analysis', justification: 'Make Contact more visible instead of hiding under dropdown.' }
      ]
    },
    {
      id: 'phase3',
      title: 'Phase 3: Homepage Transformation',
      tasks: [
        { id: 'p3t1', code: 'R-SWITCH', title: 'Update Hero Image', time: 45, source: 'Gerard Meeting', justification: 'Current solar plant image has been unchanged since launch.' },
        { id: 'p3t2', code: 'RICARDO-NEW', title: 'Add Dynamic Stats Counter', time: 120, source: 'Ricardo Meeting', justification: 'Animated counters create dynamic, engaging experience.' },
        { id: 'p3t3', code: 'R-SWITCH', title: 'Update Key Statistics', time: 30, source: 'Internal Data', justification: 'Update 700MW+ figures to reflect latest achievements.' },
        { id: 'p3t4', code: 'R-NEW', title: 'Build Corporate Credibility Section', time: 60, source: 'Strategy', justification: 'Showcase HSBC and ABC Impact partnerships prominently.' },
        { id: 'p3t5', code: 'R-NEW', title: 'Integrate Services Content', time: 90, source: 'Gerard Email', justification: 'Consolidate services into homepage for better flow.' },
        { id: 'p3t6', code: 'R-NEW', title: 'Add Latest News Showcase', time: 45, source: 'Gerard Meeting', justification: 'Demonstrate active company growth and momentum.' }
      ]
    },
    {
      id: 'phase4',
      title: 'Phase 4: About & Team Pages Enhancement',
      tasks: [
        { id: 'p4t1', code: 'RICARDO-NEW', title: 'Restructure for Japanese Corporate Style', time: 45, source: 'Ricardo Meeting', justification: 'Japanese format with organization structure and shareholders.' },
        { id: 'p4t2', code: 'RICARDO-NEW', title: 'Add Tekoma Name Origin Story', time: 30, source: 'Ricardo Meeting', justification: 'Explain meaning behind "Tekoma" for brand storytelling.' },
        { id: 'p4t3', code: 'R-NEW', title: 'Build Company History Timeline', time: 60, source: 'Best Practices', justification: 'Japanese customers expect detailed company history.' },
        { id: 'p4t4', code: 'R-NEW', title: 'Create Manager Profiles', time: 120, source: 'Gerard Meeting', justification: 'Professional photos with consistent styling for key managers.' }
      ]
    },
    {
      id: 'phase5',
      title: 'Phase 5: HSBC Compliance Updates',
      tasks: [
        { id: 'p5t1', code: 'G-SWITCH', title: 'Update Paul\'s Title', time: 5, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t2', code: 'G-SWITCH', title: 'Revise Biodiversity Claims', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t3', code: 'G-SWITCH', title: 'Update Sustainability Language', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t4', code: 'G-SWITCH', title: 'Revise Community Messaging', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t5', code: 'G-SWITCH', title: 'Update Land Lease Copy', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t6', code: 'G-SWITCH', title: 'Soften Agrisolar Claims', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t7', code: 'G-SWITCH', title: 'Adjust Floating Solar Language', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t8', code: 'G-SWITCH', title: 'Update Climate Messaging', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t9', code: 'G-FIX', title: 'Remove Homes Powered Metric', time: 5, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t10', code: 'G-SWITCH', title: 'Update 500MW Target Display', time: 5, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t11', code: 'G-SWITCH', title: 'Revise Land Management Text', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' },
        { id: 'p5t12', code: 'G-SWITCH', title: 'Update Net Zero Language', time: 10, source: 'HSBC Requirements', justification: 'Partnership compliance requirement.' }
      ]
    },
    {
      id: 'phase6',
      title: 'Phase 6: Quality Assurance & Final Polish',
      tasks: [
        { id: 'p6t1', code: 'R-NEW', title: 'Add Corporate Inquiry Fields', time: 60, source: 'Strategy', justification: 'Streamline lead generation for corporate customers.' },
        { id: 'p6t2', code: 'R-NEW', title: 'Verify Form Submission Routing', time: 15, source: 'Ricardo Meeting', justification: 'Ensure leads reach correct team members immediately.' },
        { id: 'p6t3', code: 'R-FIX', title: 'Complete Link Audit', time: 30, source: 'Best Practices', justification: 'Broken links damage user experience and SEO.' },
        { id: 'p6t4', code: 'RICARDO-NEW', title: 'Mobile Responsiveness Review', time: 120, source: 'Analytics', justification: '32% of users on mobile requires flawless experience.' }
      ]
    },
    {
      id: 'phase7',
      title: 'Phase 7: Additional Task Requests',
      tasks: [],
      isUserSubmitted: true
    }
  ]
};