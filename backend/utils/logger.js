export const logger=(req,res,next)=>{
    console.log(req.route)
    // console.log(req.path)
    next()

}