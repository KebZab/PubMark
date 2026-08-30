// Shapes returned by the existing Express API. These mirror the mapping
// functions in server/src/index.js, so field names match the wire format
// exactly (camelCase for applications, snake_case for stalls).
//
// These are JSDoc @typedef blocks rather than TypeScript types: editors read
// them for autocomplete, but nothing here runs or needs compiling. Reference
// one from another file with:  @type {import("../services/types").Stall}

/** @typedef {"pending" | "approved" | "rejected"} ApplicationStatus */

/**
 * @typedef {object} Application
 * @property {string} id
 * @property {string} userId
 * @property {string} stallId
 * @property {string|null} stallName
 * @property {string|null} stallSection
 * @property {string|null} floorArea
 * @property {string|null} applicantName
 * @property {string|null} applicantEmail
 * @property {string|null} applicantAddress
 * @property {string} businessName
 * @property {string} businessType
 * @property {string} contractStart
 * @property {string} contractTermMonths
 * @property {string} contractEnd
 * @property {string|null} permitFileName
 * @property {string|null} additionalFileName
 * @property {string} notes
 * @property {ApplicationStatus} status
 * @property {string} adminRemarks
 * @property {string} dateApplied
 * @property {string|null} permitDeadlineAt
 * @property {string|null} permitTerminatedAt
 */

/** @typedef {"info" | "warning" | "urgent" | "success"} AnnouncementType */

/**
 * @typedef {object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {AnnouncementType} type
 * @property {string} createdAt
 * @property {string} author
 * @property {string} authorId
 */

/** @typedef {"vacant" | "occupied" | "unavailable"} StallStatus */

/**
 * Stalls come back in snake_case (the stalls route returns raw rows).
 * @typedef {object} Stall
 * @property {string} id
 * @property {string} stall_name
 * @property {StallStatus} status
 * @property {string} business_type
 * @property {string} section
 * @property {string} floor
 * @property {string} floor_area
 * @property {string|null} notes
 * @property {{ type: string, coordinates: number[][][] }} geometry
 * @property {string} created_at
 */

/** @typedef {"pending" | "accepted" | "declined"} TransferStatus */

/**
 * @typedef {object} TransferRequest
 * @property {string} id
 * @property {string} fromUserId
 * @property {string} fromUserName
 * @property {string} fromUserEmail
 * @property {string} toUserId
 * @property {string} toUserName
 * @property {string} toUserEmail
 * @property {string} stallId
 * @property {string} stallName
 * @property {string} stallSection
 * @property {string} stallFloor
 * @property {string} floorArea
 * @property {string} originalApplicationId
 * @property {TransferStatus} status
 * @property {string} createdAt
 * @property {string|null} respondedAt
 */

/**
 * @typedef {"Illegal Vending" | "Health Violation" | "Fire Hazard"
 *   | "Unauthorized Expansion" | "Noise Violation" | "Improper Waste Disposal"
 *   | "Permit Expired" | "Other"} ViolationCategory
 */

/** @typedef {"open" | "resolved" | "dismissed"} ViolationStatus */

/**
 * @typedef {object} EvidenceFile
 * @property {string} name
 * @property {"image" | "video" | "document"} type
 * @property {string} size
 */

/**
 * @typedef {object} Violation
 * @property {string} id
 * @property {string} stallId
 * @property {string|null} stallName
 * @property {string} vendorName
 * @property {string} officerId
 * @property {string|null} officerName
 * @property {ViolationCategory} category
 * @property {string} description
 * @property {ViolationStatus} status
 * @property {EvidenceFile[]} evidence
 * @property {string} remarks
 * @property {string} createdAt
 * @property {string|null} resolvedAt
 */

/** @typedef {"low" | "normal" | "high" | "urgent"} CheckPriority */
/** @typedef {"pending" | "completed" | "cancelled"} CheckStatus */

/**
 * @typedef {object} CheckRequest
 * @property {string} id
 * @property {string} stallId
 * @property {string|null} stallName
 * @property {string} requestedBy
 * @property {string|null} requestedByName
 * @property {string|null} assignedTo
 * @property {string|null} assignedToName
 * @property {CheckPriority} priority
 * @property {string} reason
 * @property {string} notes
 * @property {CheckStatus} status
 * @property {string} createdAt
 * @property {string|null} completedAt
 * @property {string} completionNotes
 * @property {string} completionSummary
 * @property {EvidenceFile[]} completionFiles
 */

/** @typedef {"pending" | "verified" | "rejected"} ReceiptStatus */

/**
 * @typedef {object} PaymentReceipt
 * @property {string} id
 * @property {string} stallId
 * @property {string|null} stallName
 * @property {string} vendorId
 * @property {string} vendorName
 * @property {string} submittedBy
 * @property {string} submittedByName
 * @property {string} submittedByRole
 * @property {number|null} amount
 * @property {string} receiptDate
 * @property {string} fileName
 * @property {string} mimeType
 * @property {number} fileSize
 * @property {string|null} fileUrl Null when the receipt is metadata-only (no file uploaded).
 * @property {string} notes
 * @property {ReceiptStatus} status
 * @property {string|null} reviewedByName
 * @property {string|null} reviewedAt
 * @property {string} remarks
 * @property {string} createdAt
 */

export {};
