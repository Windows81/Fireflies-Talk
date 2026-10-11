import { type ApolloError } from "@apollo/client";
import { UpdateCategoriesError } from "../constants/error";

export const getMessageForError = (error: ApolloError) => {
  switch (error.message) {
    case UpdateCategoriesError.DUPLICATE_CATEGORY_NAME:
      return "Duplicate topic.";
    case UpdateCategoriesError.INVALID_CATEGORY:
      return "Invalid topic.";
    case UpdateCategoriesError.CATEGORY_NOT_FOUND:
      return "Category not found.";
    case UpdateCategoriesError.NOT_ALLOWED:
      return "Not allowed.";
    default:
      return "Unable to edit the topic.";
  }
};
