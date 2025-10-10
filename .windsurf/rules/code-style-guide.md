---
trigger: always_on
---

# Code Style
- Use kebab case for file name style
- NO unused variable / import
- Component, Utilities, Helpers MUST be reusability and testability

# Folder / File Structure
- Client side component under rcc folder within the route
- Generic / composite component under `/components` folder
- Hooks under `/hooks` folder
- Reusable utils that can be used in server/client are under `/utils`

# Form Data Store
- It must be scoped within the component
- Must use react-hook-form