import { router as authRouter} from "./auth.routes.js" ;
import { router as topicRouter} from "./topic.routes.js";
import { router as progressRouter} from "./progress.routes.js" ;
import { router as learningSessionRouter} from "./learningSession.routes.js" ;
import { router as translationRouter} from "./translation.routes.js" ;
import { router as dictionaryRouter} from "./dictionary.routes.js" ;
import audioRouter from './audio.routes.js'
import aiPortalRouter from './aiPortal.routes.js'
function route(app) {
    
    app.use('/auth', authRouter);
    app.use('/topics', topicRouter);
    app.use('/progress', progressRouter);
    app.use('/learning-sessions', learningSessionRouter);
    app.use('/translation', translationRouter);
    app.use('/dictionary', dictionaryRouter);
    app.use('/api/audio', audioRouter)
    app.use('/api/ai-portal', aiPortalRouter);

    // app.use('/lesson-groups', lessonGroupsRouter);
    // app.use('/users', userRouter);
}

export default route;