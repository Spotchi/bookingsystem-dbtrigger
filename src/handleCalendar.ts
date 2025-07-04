export const handleCalenderEntry = async (record, type, isAuthenticated) => {
  //
  if (!isAuthenticated) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: "Calendar handling failed",
          missing: {
            authentication: !isAuthenticated,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        }
      ),
    };
  }

  // TODO handle calendar entry
  if (type === "new_booking") {
    // create calendar entry
  } else if (type === "confirmed_booking") {
    // set calendar entry to confirmed
  }

  return { success: true };
};
