import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1F4D3D")) # FundsRoom Green
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "FUNDSROOM — MINI ERP + CRM OPERATIONS PORTAL")
            self.drawRightString(letter[0] - 54, letter[1] - 36, "TECHNICAL DOCUMENTATION")
            self.setStrokeColor(colors.HexColor("#C9BFA8"))
            self.setLineWidth(0.75)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B6358"))
        self.drawString(54, 30, "Candidate: Karthik Yernana (B.Tech CSE 2027) | FundsRoom Full Stack Case Study")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 30, page_text)
        self.setStrokeColor(colors.HexColor("#C9BFA8"))
        self.setLineWidth(0.75)
        self.line(54, 42, letter[0] - 54, 42)
        
        self.restoreState()

def build_pdf(filename="FundsRoom_Project_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1F4D3D")
    dark_ink = colors.HexColor("#211D18")
    accent_gold = colors.HexColor("#C98A2C")
    paper_bg = colors.HexColor("#F7F6F2")
    border_color = colors.HexColor("#C9BFA8")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=dark_ink,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1Style',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark_ink,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=dark_ink,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1F4D3D"),
        backColor=colors.HexColor("#EDE7DA"),
        borderPadding=6,
        spaceAfter=8
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=dark_ink
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.white
    )

    story = []

    # ─── Title Section ────────────────────────────────────────────────────────
    story.append(Paragraph("FUNDSROOM — MINI ERP + CRM", title_style))
    story.append(Paragraph("System Architecture, Security Safeguards & Technical Documentation", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    # Meta Info Block Table
    meta_data = [
        [Paragraph("<b>Candidate:</b> Karthik Yernana", table_cell), Paragraph("<b>Degree & Branch:</b> B.Tech CSE (2027)", table_cell)],
        [Paragraph("<b>Live Frontend:</b> <font color='#1F4D3D'><u>https://fundsroom-green.vercel.app/</u></font>", table_cell), Paragraph("<b>Live Backend API:</b> <font color='#1F4D3D'><u>https://fundsroom-lp8g.onrender.com</u></font>", table_cell)],
        [Paragraph("<b>GitHub Repository:</b> <font color='#1F4D3D'><u>https://github.com/karthikyernana/fundsroom</u></font>", table_cell), Paragraph("<b>Health Check:</b> <font color='#1F4D3D'><u>https://fundsroom-lp8g.onrender.com/health</u></font>", table_cell)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), paper_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ─── Executive Summary & Business Flow ──────────────────────────────────
    story.append(Paragraph("1. Executive Summary & Business Context", h1_style))
    story.append(Paragraph(
        "FundsRoom is a full-stack, enterprise-grade Mini ERP + CRM operations portal built for wholesale distribution companies. "
        "The system coordinates internal business workflows across <b>Customer CRM</b>, <b>Product Inventory</b>, <b>Sales Dispatch Challans</b>, and <b>Role-Based Access Control (RBAC)</b>. "
        "The primary engineering objective is enforcing <b>strict atomic transaction safety</b>, <b>historical snapshot integrity</b>, and a <b>tamper-proof stock audit trail</b>.",
        body_style
    ))

    # ─── Test Credentials Matrix ─────────────────────────────────────────────
    story.append(Paragraph("2. Test Login Credentials & Permission Matrix", h1_style))
    cred_data = [
        [Paragraph("Role", table_header), Paragraph("Email", table_header), Paragraph("Password", table_header), Paragraph("Module Access Scope & Key Capabilities", table_header)],
        [Paragraph("<b>Admin</b>", table_cell), Paragraph("admin@fundsroom.com", table_cell), Paragraph("password123", table_cell), Paragraph("Full system CRUD across all modules. Can onboard & manage internal user accounts via /users.", table_cell)],
        [Paragraph("<b>Sales Lead</b>", table_cell), Paragraph("sales@fundsroom.com", table_cell), Paragraph("password123", table_cell), Paragraph("Customer CRM CRUD, lead assignment, 'My Accounts' portfolio filter, draft & confirm challans.", table_cell)],
        [Paragraph("<b>Sales Rep 2</b>", table_cell), Paragraph("sales2@fundsroom.com", table_cell), Paragraph("password123", table_cell), Paragraph("Separate assigned customer portfolio, lead tracking, draft & confirm sales challans.", table_cell)],
        [Paragraph("<b>Warehouse</b>", table_cell), Paragraph("warehouse@fundsroom.com", table_cell), Paragraph("password123", table_cell), Paragraph("Product & Stock CRUD, manual stock movements, read customer context, dispatch challans.", table_cell)],
        [Paragraph("<b>Accounts</b>", table_cell), Paragraph("accounts@fundsroom.com", table_cell), Paragraph("password123", table_cell), Paragraph("Read-only across all modules, snapshot pricing inspection, B2B Tax Invoice & PDF Export.", table_cell)]
    ]
    cred_table = Table(cred_data, colWidths=[70, 130, 70, 234])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 14))

    # ─── Technology Stack ────────────────────────────────────────────────────
    story.append(Paragraph("3. Technology Stack & Architectural Layering", h1_style))
    tech_data = [
        [Paragraph("Layer", table_header), Paragraph("Technology Selection", table_header), Paragraph("Architectural Rationale & Utility", table_header)],
        [Paragraph("<b>Backend Runtime</b>", table_cell), Paragraph("Node.js (v18+) + TypeScript", table_cell), Paragraph("Strict compile-time type checking, asynchronous non-blocking event loop.", table_cell)],
        [Paragraph("<b>Framework</b>", table_cell), Paragraph("Express.js", table_cell), Paragraph("Lightweight, full control over REST routing and custom RBAC middleware.", table_cell)],
        [Paragraph("<b>Database</b>", table_cell), Paragraph("PostgreSQL (Supabase)", table_cell), Paragraph("ACID compliance, row locking, relational constraints, raw SQL execution.", table_cell)],
        [Paragraph("<b>ORM & Validation</b>", table_cell), Paragraph("Prisma ORM + Zod", table_cell), Paragraph("Schema-driven migration management and runtime input validation on write routes.", table_cell)],
        [Paragraph("<b>Frontend</b>", table_cell), Paragraph("React 19 + TypeScript (Vite)", table_cell), Paragraph("Component architecture, fast HMR, strict state typing.", table_cell)],
        [Paragraph("<b>State Management</b>", table_cell), Paragraph("TanStack Query (v5)", table_cell), Paragraph("Server state caching, automatic revalidation, and optimistic updates.", table_cell)],
        [Paragraph("<b>Design System</b>", table_cell), Paragraph("Vanilla CSS (Custom Tokens)", table_cell), Paragraph("High-craft financial design system following PRD color & typography tokens.", table_cell)]
    ]
    tech_table = Table(tech_data, colWidths=[100, 140, 264])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 14))

    # ─── Core Security & Business Logic ─────────────────────────────────────
    story.append(Paragraph("4. Core Security & Business Logic Guarantees", h1_style))
    
    story.append(Paragraph("A. Atomic Transaction Safety (§5 — Preventing Negative Stock Overdraw)", h2_style))
    story.append(Paragraph(
        "To prevent Time-of-Check to Time-of-Use (TOCTOU) race conditions when multiple concurrent requests attempt to confirm a challan for low-stock items, "
        "stock reduction uses a single atomic SQL statement via Prisma <code>$executeRaw</code>:",
        body_style
    ))
    story.append(Paragraph(
        "UPDATE \"products\"<br/>"
        "SET \"current_stock\" = \"current_stock\" - $qty, \"updated_at\" = NOW()<br/>"
        "WHERE \"id\" = $productId::uuid AND \"current_stock\" >= $qty;",
        code_style
    ))
    story.append(Paragraph(
        "<b>Guarantees:</b> <code>$executeRaw</code> returns affected rows (1 = success, 0 = stock modified/insufficient at instant of execution). "
        "If any single line item fails, the entire Prisma <code>$transaction</code> aborts and rolls back stock for earlier items. "
        "A PostgreSQL check constraint <code>CHECK (\"current_stock\" >= 0)</code> acts as an engine-level backstop.",
        body_style
    ))

    story.append(Paragraph("B. Historical Line Item Snapshot Pricing (§4)", h2_style))
    story.append(Paragraph(
        "When a sales challan is created, <code>product_name_snapshot</code>, <code>product_sku_snapshot</code>, and <code>unit_price_snapshot</code> "
        "are frozen at creation time. Future catalog price changes or product renames will never corrupt historical sales records.",
        body_style
    ))

    story.append(Paragraph("C. Strict Audit Trail Enforcement", h2_style))
    story.append(Paragraph(
        "Direct edits to <code>current_stock</code> via <code>PUT /products/:id</code> are explicitly blocked. All inventory changes must originate "
        "from either a confirmed sales challan or an explicit <code>POST /products/:id/stock-movements</code> call with user attribution and reasoning.",
        body_style
    ))

    story.append(Spacer(1, 10))

    # ─── 54-Test Integration Suite ──────────────────────────────────────────
    story.append(Paragraph("5. Automated Integration Test Suite (54 Tests)", h1_style))
    story.append(Paragraph(
        "A 54-test integration suite built with Jest & Supertest verifies all API endpoints and business logic against a live PostgreSQL database:",
        body_style
    ))

    suite_data = [
        [Paragraph("Module Suite", table_header), Paragraph("Test Count", table_header), Paragraph("Key Functional Verifications", table_header), Paragraph("Status", table_header)],
        [Paragraph("<b>POST /auth/login</b>", table_cell), Paragraph("6", table_cell), Paragraph("Password hashing, role claims, missing fields, malformed input rejection.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)],
        [Paragraph("<b>GET /auth/me</b>", table_cell), Paragraph("3", table_cell), Paragraph("Token validation, password_hash exclusion from payload.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)],
        [Paragraph("<b>Customers CRM</b>", table_cell), Paragraph("17", table_cell), Paragraph("CRUD, pagination, search, assigned sales rep, GST regex, follow-up date.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)],
        [Paragraph("<b>Products & Inventory</b>", table_cell), Paragraph("12", table_cell), Paragraph("SKU uppercase, manual IN/OUT stock, zero stock boundary, low_stock filter.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)],
        [Paragraph("<b>Challans Engine</b>", table_cell), Paragraph("14", table_cell), Paragraph("Sequential numbering, snapshot pricing, 409 rollback, concurrent double-confirm race.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)],
        [Paragraph("<b>System & Health</b>", table_cell), Paragraph("2", table_cell), Paragraph("GET /health status ok, 404 JSON fallback for unmapped routes.", table_cell), Paragraph("<b>100% PASS</b>", table_cell)]
    ]
    suite_table = Table(suite_data, colWidths=[110, 60, 244, 90])
    suite_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(suite_table)
    story.append(Spacer(1, 14))

    # ─── REST API Endpoint Matrix ───────────────────────────────────────────
    story.append(Paragraph("6. REST API Reference Matrix", h1_style))
    api_data = [
        [Paragraph("Method", table_header), Paragraph("Endpoint", table_header), Paragraph("Allowed Roles", table_header), Paragraph("Description", table_header)],
        [Paragraph("POST", table_cell), Paragraph("/auth/login", table_cell), Paragraph("All", table_cell), Paragraph("Authenticate user & return JWT token", table_cell)],
        [Paragraph("GET", table_cell), Paragraph("/auth/me", table_cell), Paragraph("All", table_cell), Paragraph("Get current authenticated user profile", table_cell)],
        [Paragraph("GET", table_cell), Paragraph("/auth/sales-reps", table_cell), Paragraph("All", table_cell), Paragraph("List sales representatives for lead assignment", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/auth/register", table_cell), Paragraph("Admin", table_cell), Paragraph("Onboard new user (Admin, Sales, Warehouse, Accounts)", table_cell)],
        [Paragraph("GET", table_cell), Paragraph("/customers", table_cell), Paragraph("All", table_cell), Paragraph("List customers (search, status, assigned_to, my_customers, page)", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/customers", table_cell), Paragraph("Admin, Sales", table_cell), Paragraph("Create customer record with assigned sales rep", table_cell)],
        [Paragraph("GET/PUT", table_cell), Paragraph("/customers/:id", table_cell), Paragraph("Admin, Sales", table_cell), Paragraph("Get / Update customer profile & assigned sales rep", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/customers/:id/notes", table_cell), Paragraph("Admin, Sales", table_cell), Paragraph("Append follow-up note to customer timeline", table_cell)],
        [Paragraph("GET/POST", table_cell), Paragraph("/products", table_cell), Paragraph("Admin, Warehouse", table_cell), Paragraph("List products (search, low_stock) / Create product", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/products/:id/stock-movements", table_cell), Paragraph("Admin, Warehouse", table_cell), Paragraph("Record manual IN / OUT stock movement with audit reason", table_cell)],
        [Paragraph("GET/POST", table_cell), Paragraph("/challans", table_cell), Paragraph("Admin, Sales, Warehouse", table_cell), Paragraph("List challans / Create draft challan with snapshot pricing", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/challans/:id/confirm", table_cell), Paragraph("Admin, Sales, Warehouse", table_cell), Paragraph("Confirm challan & atomically deduct stock", table_cell)],
        [Paragraph("POST", table_cell), Paragraph("/challans/:id/cancel", table_cell), Paragraph("Admin, Warehouse", table_cell), Paragraph("Cancel draft or un-dispatched sales challan", table_cell)]
    ]
    api_table = Table(api_data, colWidths=[55, 150, 115, 184])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 14))

    # ─── Deployment & Tradeoffs ─────────────────────────────────────────────
    story.append(Paragraph("7. Deployment Architecture & Known Tradeoffs", h1_style))
    story.append(Paragraph(
        "<b>Live Production Deployment:</b><br/>"
        "• <b>Frontend:</b> Hosted on Vercel (<code>https://fundsroom-green.vercel.app/</code>) with SPA rewrites (<code>vercel.json</code>).<br/>"
        "• <b>Backend API:</b> Hosted on Render (<code>https://fundsroom-lp8g.onrender.com</code>) running Node.js runtime.<br/>"
        "• <b>Database:</b> Managed PostgreSQL on Supabase with Prisma connection pooling.<br/><br/>"
        "<b>Known Limitations & Engineering Tradeoffs:</b><br/>"
        "1. <i>In-Memory Low-Stock Post-Filtering:</i> Prisma ORM currently lacks native column-to-column comparison queries (e.g. <code>WHERE current_stock <= min_stock_alert</code>). The service post-filters in JS, which is fine for current scale but would be refactored to raw SQL for >100k SKUs.<br/>"
        "2. <i>Stateless JWT Expiration:</i> Tokens expire in 24 hours. Immediate revocation prior to expiration requires Redis token blocklisting.",
        body_style
    ))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print("PDF build successful: FundsRoom_Project_Documentation.pdf")

if __name__ == "__main__":
    build_pdf()
