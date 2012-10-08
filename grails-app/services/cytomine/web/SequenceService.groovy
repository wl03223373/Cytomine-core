package cytomine.web

class SequenceService {

    def sessionFactory
    def grailsApplication
    public final static String SEQ_NAME = "hibernate_sequence"
    static transactional = true

    def initSequences() {
        sessionFactory.getCurrentSession().clear();
        def connection = sessionFactory.currentSession.connection()

        /*grailsApplication.getDomainClasses().each { domain->
          def seqName = domain.name + SEQ_SUFFIX
          try {
            log.info "Creating sequence for domain class " + domain.name + " : " + seqName
            def statement  = connection.createStatement()
            def dropSequenceQuery = "DROP SEQUENCE IF EXISTS "+seqName +";"
            def createSequenceQuery = "CREATE SEQUENCE "+seqName+" START 1;"
            statement.execute(dropSequenceQuery + createSequenceQuery)
          }
          catch (org.postgresql.util.PSQLException e) {
            log.info e
          }
        }*/
        try {
            def statement = connection.createStatement()
            def dropSequenceQuery = ""//"DROP SEQUENCE IF EXISTS "+SEQ_NAME+";"
            def createSequenceQuery = "CREATE SEQUENCE " + SEQ_NAME + " START 1;"
            statement.execute(dropSequenceQuery + createSequenceQuery)
        } catch (org.postgresql.util.PSQLException e) {
            log.info e
        }

    }

    def generateID(domain) {
        //int classNameIndex=domain.getClass().getName().lastIndexOf ('.') + 1;
        //def seqName =  domain.getClass().getName().substring(classNameIndex) + SEQ_SUFFIX
        // sessionFactory.getCurrentSession().clear();
        def statement = sessionFactory.currentSession.connection().createStatement()
        def res = statement.executeQuery("select nextval('" + SEQ_NAME + "');")
        res.next()
        Long nextVal = res.getLong("nextval")
        //log.info "Get nextval for " +  domain.getClass().getName()    + " : " + nextVal
        return nextVal
    }
}
