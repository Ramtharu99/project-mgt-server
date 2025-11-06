export const protect = async (req, res, next) => {
    try {
        const {userId} = await req.auth();
        if(!userId){
            return res.status(401).json({
                status: "error",
                message: "Unauthorized",
            });
        }
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }
}